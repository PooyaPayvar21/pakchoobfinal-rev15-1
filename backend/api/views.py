import logging
import traceback
import jdatetime
import requests
import time
from datetime import datetime
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, generics, viewsets, permissions
from rest_framework.decorators import (
    api_view,
    permission_classes,
    action,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.authentication import TokenAuthentication
from .models import (
    LoginUser,
    SubmitForm,
    TechnicianSubmit,
    Personel,
    Aghlam,
    PmForms,
    PmTechnician,
    PmPersonel,
    PmAghlam,
    Reminder,
    WaterTreatment,
    SubmitPM
)
from .serializers import (
    SubmitFormSerializer,
    TechnicianSubmitSerializer,
    PersonelSerializer,
    AghlamSerializer,
    PmFormsSerializer,
    PmTechnicianSerializer,
    PmPersonelSerializer,
    PmAghlamSerializer,
    ReminderSerializer,
    WaterTreatmentSerializer,
    SubmitPMSerializer
)

SECTION_CODES = {
    # MDF-2
    "Chipper": "01",
    "Conveyor Line": "02",
    "Dryer & Air Grader": "03",
    "Refiner": "04",
    "Before Press": "05",
    "Press": "06",
    "After Press": "07",
    "Sanding": "09",
    "Cooling System": "08",
    "Steam Boiler": "10",
    "General": "11",
    # MDF-1
    "Melamine": "01",
    "High Glass": "05",
    "Formalin": "08",
    "Resin": "07",
    "Purification Plant": "04",
    "Agheshte": "03",
}

User = get_user_model()

logger = logging.getLogger(__name__)

# SMS API configuration
SMS_API_URL = "http://sms.ahoorasms.ir/smsws/HttpService.ashx"
SMS_USERNAME = "pakchoob"
SMS_PASSWORD = "pak@@1402"
SMS_FROM = "90005026"


@api_view(["POST"])
@permission_classes([AllowAny])
def send_sms(request):
    try:
        to = request.data.get("to")
        message = request.data.get("message")

        if not to or not message:
            return Response(
                {"status": "error", "message": "Both 'to' and 'message' are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Send SMS using the API
        params = {
            "service": "SendArray",
            "username": SMS_USERNAME,
            "password": SMS_PASSWORD,
            "to": to,
            "message": message,
            "from": SMS_FROM,
            "flash": "false",
        }

        # Log the request parameters (excluding sensitive data)
        logger.info(f"Sending SMS to {to} with message length {len(message)}")

        # Add retry logic
        max_retries = 3
        retry_delay = 1  # seconds

        for attempt in range(max_retries):
            try:
                # Make POST request to SMS API
                response = requests.post(SMS_API_URL, data=params, timeout=10)

                # Log the response
                logger.info(f"SMS API Response Status: {response.status_code}")
                logger.info(f"SMS API Response Content: {response.text}")

                if response.status_code == 200:
                    return Response(
                        {"status": "success", "message": "SMS sent successfully"}
                    )
                elif response.status_code == 503:
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"SMS service unavailable, retrying in {retry_delay} seconds..."
                        )
                        time.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        continue
                    else:
                        logger.error("SMS service unavailable after all retries")
                        return Response(
                            {
                                "status": "error",
                                "message": "SMS service is temporarily unavailable. Please try again later.",
                            },
                            status=status.HTTP_503_SERVICE_UNAVAILABLE,
                        )
                else:
                    logger.error(
                        f"Failed to send SMS. Status: {response.status_code}, Response: {response.text}"
                    )
                    return Response(
                        {
                            "status": "error",
                            "message": f"Failed to send SMS: {response.text}",
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"Request failed, retrying in {retry_delay} seconds... Error: {str(e)}"
                    )
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                else:
                    logger.error(f"All retry attempts failed: {str(e)}")
                    return Response(
                        {
                            "status": "error",
                            "message": "Failed to connect to SMS service. Please try again later.",
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


WORKTYPE_MAP = {
    "mechanic": "مکانیک",
    "electric": "برق",
    "utility": "تاسیسات",
    "metalworking": "فلزکاری",
    "tarashkari": "تراشکاری",
    "paint": "رنگ و سندبلاست",
    "generalmechanic": "مکانیک عمومی",
}

@api_view(["POST","GET"])
@permission_classes([AllowAny])
def SubmitPMCreate(request):
    if request.method == "POST":
        try:
            data = request.data or {}
            pmsubmitdate = data.get("pmsubmitdate")
            pmserial = data.get("pmserial")
            pmsection = data.get("pmsection", "")
            pmsubject = data.get("pmsubject", "")
            pmworktype = data.get("pmworktype", "") or data.get("worktype", "")

            # Basic validation
            if not pmserial or not pmsubject:
                return Response(
                    {"status": "error", "message": "pmserial and pmsubject are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Parse date safely if given as string
            parsed_date = None
            if pmsubmitdate:
                try:
                    if isinstance(pmsubmitdate, dict):
                        # If frontend sends an object, try to extract ISO-like string
                        iso = pmsubmitdate.get("iso") or pmsubmitdate.get("date") or pmsubmitdate.get(
                            "value"
                        )
                        if iso:
                            parsed_date = datetime.fromisoformat(iso.replace("Z", "+00:00"))
                        else:
                            parsed_date = None
                    elif isinstance(pmsubmitdate, str):
                        parsed_date = datetime.fromisoformat(pmsubmitdate.replace("Z", "+00:00"))
                    else:
                        parsed_date = pmsubmitdate
                except Exception:
                    parsed_date = None

            submit_pm = SubmitPM.objects.create(
                pmsubmitdate=parsed_date,
                pmserial=pmserial,
                pmsection=pmsection,
                pmsubject=pmsubject,
                pmworktype=pmworktype,
                pmstatus=data.get("pmstatus", "not_completed"),
                created_by=request.user if request.user and request.user.is_authenticated else None,
            )
            serializer = SubmitPMSerializer(submit_pm)
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # GET - list
    try:
        forms = SubmitPM.objects.all().order_by("-created_at")
        serializer = SubmitPMSerializer(forms, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([AllowAny])
def SubmitPMDetail(request, pmserial):
    """
    GET: retrieve by pmserial
    PUT: update by pmserial
    DELETE: delete by pmserial
    """
    # Try multiple ways to resolve the identifier sent by the frontend:
    # 1) pmserial, 2) pmformcode, 3) primary key
    pm = None
    try:
        pm = SubmitPM.objects.get(pmserial=pmserial)
    except SubmitPM.DoesNotExist:
            try:
                # try numeric primary key
                pm = SubmitPM.objects.get(pk=int(pmserial))
            except Exception:
                return Response({"status": "error", "message": "Form not found"}, status=status.HTTP_404_NOT_FOUND)
 
    if request.method == "GET":
        serializer = SubmitPMSerializer(pm)
        return Response(serializer.data)

    if request.method == "PUT":
        try:
            data = request.data
            # Allow updating a subset of fields
            for field in ("pmsubmitdate", "pmsubject", "pmsection", "pmworktype", "pmstatus"):
                if field in data:
                    value = data[field]
                    if field == "pmsubmitdate" and isinstance(value, str):
                        try:
                            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
                        except Exception:
                            value = None
                    setattr(pm, field, value)
            pm.current_assignee = request.user if request.user and request.user.is_authenticated else pm.current_assignee
            pm.save()
            serializer = SubmitPMSerializer(pm)
            return Response({"status": "success", "data": serializer.data})
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)

    if request.method == "DELETE":
        try:
            pm.delete()
            return Response({"status": "success", "message": "Deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=500)
            


def generate_formcode(phase, section_code, problemdate):
    date_str = problemdate.strftime("%m") if problemdate else "00"
    return f"{phase}{section_code}{date_str}"


class SubmitFormDetailByCodeView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update a form by its formcode
    """

    queryset = SubmitForm.objects.all()
    serializer_class = SubmitFormSerializer
    lookup_field = "formcode"

    def put(self, request, *args, **kwargs):
        try:
            # Get the instance
            instance = self.get_object()

            # Update only the formtype field
            instance.formtype = request.data.get("formtype", instance.formtype)
            instance.save(update_fields=["formtype"])

            # Serialize the updated instance
            serializer = self.get_serializer(instance)

            return Response(
                {
                    "status": "success",
                    "message": "Form type updated successfully",
                    "form": serializer.data,
                }
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class PmTechnicianSubmitDetail(APIView):
    """
    Retrieve and update a form by its formcode
    """

    permission_classes = [AllowAny]  # Allow any user to access this endpoint for now

    def get(self, request, pmformcode):
        try:
            technicians = PmTechnician.objects.filter(pmformcode=pmformcode)
            serializer = PmTechnicianSerializer(technicians, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, *args, **kwargs):
        try:
            # Get the instance
            instance = self.get_object()

            # Update only the formtype field
            instance.formtype = request.data.get("formtype", instance.formtype)
            instance.save(update_fields=["formtype"])

            # Serialize the updated instance
            serializer = self.get_serializer(instance)

            return Response(
                {
                    "status": "success",
                    "message": "Form type updated successfully",
                    "form": serializer.data,
                }
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubmitFormDetailView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get(self, request, pk):
        submit_form = get_object_or_404(SubmitForm, pk=pk)
        serializer = SubmitFormSerializer(submit_form)
        return Response(
            {"form_data": serializer.data, "user_type": request.user.user_type}
        )


class PmTechnicianSubmitList(APIView):
    permission_classes = [AllowAny]  # Allow any user to access this endpoint for now

    def get(self, request):
        # Get the pmformcode from query parameters if provided
        pmformcode = request.query_params.get("pmformcode")

        # Filter by pmformcode if provided
        if pmformcode:
            submissions = PmTechnician.objects.filter(pmformcode=pmformcode)
        else:
            submissions = PmTechnician.objects.all()

        serializer = PmTechnicianSerializer(submissions, many=True)
        return Response(serializer.data)


# PM Form Submit
@api_view(["POST", "GET", "DELETE", "PUT"])
@permission_classes([AllowAny])
def PmFormCreate(request):
    if request.method == "PUT":
        try:
            pmformcode = request.data.get("pmformcode")
            if not pmformcode:
                return Response(
                    {"status": "error", "message": "Form code is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            form = get_object_or_404(PmForms, pmformcode=pmformcode)
            form.pmformnote = request.data.get("pmnote", "")
            form.save(update_fields=["pmformnote"])
            # Return the updated form data including the note
            return Response(
                {
                    "status": "success",
                    "message": "Note updated successfully",
                    "form": {
                        "pmformcode": form.pmformcode,
                        "pmformnote": form.pmformnote,
                    },
                }
            )
        except SubmitForm.DoesNotExist:
            return Response(
                {"status": "error", "message": "Form not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if request.method == "DELETE":
        try:
            # Extract pmformcode from URL path
            pmformcode = request.path.split("/")[-2]
            pm_form = get_object_or_404(PmForms, pmformcode=pmformcode)
            pm_form.delete()
            return Response(
                {"status": "success", "message": "Form deleted successfully"}
            )
        except PmForms.DoesNotExist:
            return Response(
                {"status": "error", "message": "Form not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    if request.method == "POST":
        try:
            pmformdate_str = request.data.get("pmformdate")
            pmphase = request.data.get("pmphase", "01")
            pmworktype = request.data.get("pmworktype")
            unitname = request.data.get("unitname")
            pmsection = request.data.get("pmsection")
            pmmachinename = request.data.get("pmmachinename")
            pmsubject = request.data.get("pmsubject")

            # Convert timestamps
            try:
                if pmformdate_str:
                    # Convert Persian date to Gregorian
                    persian_pmformdate = jdatetime.datetime.strptime(
                        pmformdate_str, "%Y/%m/%d %H:%M"
                    )
                    pmformdate = persian_pmformdate.togregorian()
                else:
                    pmformdate = None
            except ValueError as e:
                return Response(
                    {
                        "status": "error",
                        "message": f"Invalid datetime format: {str(e)}",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
                # Validate required fields

            if not pmmachinename or not pmsubject:
                return Response(
                    {"status": "error", "message": "Required fields are missing"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            section_code = SECTION_CODES.get(pmsection, "01")

            # Generate formcode using the standardized function from utils
            from .utils import generate_pm_formcode

            base_pmformcode = generate_pm_formcode(pmphase, section_code, pmformdate)

            # Find the last form with this base formcode and increment the sequence
            last_form = (
                PmForms.objects.filter(pmformcode__startswith=base_pmformcode)
                .order_by("-pmformcode")
                .first()
            )

            if last_form:
                last_number = int(last_form.pmformcode[-2:])
                new_last_two = str(last_number + 1).zfill(2)
                if last_number >= 99:
                    return Response(
                        {
                            "status": "error",
                            "message": "Reached maximum formcode limit",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                pmformcode = base_pmformcode + new_last_two
            else:
                pmformcode = base_pmformcode + "01"
            # Save to database
            try:
                form = PmForms.objects.create(
                    pmformcode=pmformcode,
                    pmformdate=pmformdate,
                    pmphase=pmphase,
                    pmworktype=pmworktype,
                    unitname=unitname,
                    pmsection=pmsection,
                    pmmachinename=pmmachinename,
                    pmsubject=pmsubject,
                )
                return Response(
                    {
                        "status": "success",
                        "message": "Form submitted successfully",
                        "pmformcode": pmformcode,
                    }
                )
            except Exception as e:
                return Response(
                    {"status": "error", "message": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    elif request.method == "GET":
        try:
            forms = PmForms.objects.all().order_by("-pmformdate")
            serializer = PmFormsSerializer(forms, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    elif request.method == "DELETE":
        try:
            pmformcode = request.path.split("/")[-2]  # Extract pmformcode from URL
            form = get_object_or_404(PmForms, pmformcode=pmformcode)
            form.delete()
            return Response(
                {"status": "success", "message": "Form deleted successfully"}
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

# Water Treatment Submit
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def WaterTreatmentSubmit(request):
    if request.method == 'POST':
        try:
            operator = request.data.get('operator')
            tarikhesabt = request.data.get('tarikhesabt')
            ghesmat = request.data.get('ghesmat')
            mozu = request.data.get('mozu')
            value = request.data.get('value')
            shift = request.data.get('shift')
            # Check Validation
            if not operator or not tarikhesabt:
                return Response(
                    {'status': 'error', "message": 'فیلد ها را پر کنید'},status=status.HTTP_400_BAD_REQUEST,
                )
            
            try:
                if isinstance(tarikhesabt, dict):
                    year = tarikhesabt.get('year')
                    month = tarikhesabt.get('month', {}).get('number')
                    day = tarikhesabt.get('day')
                    hour = tarikhesabt.get('hour',0)
                    minutes = tarikhesabt.get('minute',0)
                    
                    persian_date = jdatetime.datetime(year, month, day, hour, minutes)
                    tarikhesabt = persian_date.togregorian()
                else:
                    tarikhesabt = jdatetime.datetime.strptime(tarikhesabt, "%Y/%m/%d %H:%M")
                    tarikhesabt = tarikhesabt.togregorian()
            except Exception as e:
                print(f"Date Conversion Error: {str(e)}")
                return Response ({
                    'status': 'error', 'message': 'فرمت تاریخ اشتباه است'
                },status=status.HTTP_400_BAD_REQUEST)
                    
            
            water_treatment = WaterTreatment.objects.create(
                operator = operator,
                tarikhesabt = tarikhesabt,
                ghesmat = ghesmat,
                mozu = mozu,
                value = value,
                shift = shift
            )
            return Response (
                {"status": 'success', 'message': 'Form Submitted Successfully', 'data': {
                    'id': water_treatment.id,
                    'operator': water_treatment.operator,
                    'tarikhesabt': water_treatment.tarikhesabt,
                    'ghesmat': water_treatment.ghesmat,
                    'mozu': water_treatment.mozu,
                    'value': water_treatment.value,
                    'shift': water_treatment.shift
                }},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            print(f"Error in WaterTreatmentSubmit: {str(e)}") 
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    elif request.method == 'GET':
        try:
            treatments = WaterTreatment.objects.all()
            data = [{
                'id': t.id,
                'operator': t.operator,
                'tarikhesabt': t.tarikhesabt,
                'ghesmat': t.ghesmat,
                'mozu': t.mozu,
                'value': t.value,
                'shift': t.shift
            }for t in treatments]
            
            return Response (
                {
                    'status': 'success',
                    'data': data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
            
# Pm Technician Submit             
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def PmTechnicianSubmit(request):
    if request.method == "POST":
        try:
            pmformcode = request.data.get("pmformcode")
            pmfailurereason = request.data.get("pmfailurereason")
            pmworktype = request.data.get("pmworktype")
            pmproblemdescription = request.data.get("pmproblemdescription")
            startpmrepairtime = request.data.get("startpmrepairtime")
            endpmrepairtime = request.data.get("endpmrepairtime")
            worktime = request.data.get("worktime")
            notdonereason = request.data.get("notdonereason")
            pmjobstatus = request.data.get("pmjobstatus")

            # Validate required fields
            if not worktime or not pmworktype or not pmproblemdescription:
                return Response(
                    {"status": "error", "message": "Required fields are missing"},
                    status=400,
                )

            def parse_datetime(dt_str):
                try:
                    if not dt_str:
                        return None

                    # Try parsing as ISO format first
                    try:
                        return timezone.make_aware(
                            datetime.datetime.fromisoformat(
                                dt_str.replace("Z", "+00:00")
                            )
                        )
                    except ValueError:
                        # If ISO format fails, try other formats
                        try:
                            return timezone.make_aware(
                                datetime.datetime.strptime(
                                    dt_str, "%Y-%m-%dT%H:%M:%S.%fZ"
                                )
                            )
                        except ValueError:
                            try:
                                return timezone.make_aware(
                                    datetime.datetime.strptime(
                                        dt_str, "%Y-%m-%dT%H:%M:%SZ"
                                    )
                                )
                            except ValueError:
                                return None
                except Exception as e:
                    print(f"Error parsing datetime: {str(e)}")
                return None

            startpmrepairtime = parse_datetime(startpmrepairtime)
            endpmrepairtime = parse_datetime(endpmrepairtime)

            try:
                pm_form = PmForms.objects.get(pmformcode=pmformcode)
            except PmForms.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Form not found"}, status=404
                )

            # Delete existing technician submission if it exists
            existing_submission = PmTechnician.objects.filter(
                pmformcode=pmformcode
            ).first()
            if existing_submission:
                existing_submission.delete()

            # Create the technician submission and link it to the PM form
            # Ensure notdonereason has a default value if not provided
            if notdonereason is None or notdonereason == "":
                if pmjobstatus == "خیر":
                    notdonereason = "دلیل انجام نشدن مشخص نشده"
                else:
                    notdonereason = "انجام شده"

            technician_form = PmTechnician.objects.create(
                pmformcode=pmformcode,
                pmfailurereason=pmfailurereason,
                pmworktype=pmworktype,
                pmproblemdescription=pmproblemdescription,
                startpmrepairtime=startpmrepairtime,
                endpmrepairtime=endpmrepairtime,
                worktime=worktime,
                notdonereason=notdonereason,
                pmjobstatus=pmjobstatus,
            )
            return Response(
                {
                    "status": "success",
                    "message": "Form submitted successfully",
                    "pmformcode": pmformcode,
                }
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    elif request.method == "GET":
        try:
            forms = PmForms.objects.all().order_by("-pmformdate")
            serializer = PmFormsSerializer(forms, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    elif request.method == "DELETE":
        try:
            pmformcode = request.path.split("/")[-2]  # Extract pmformcode from URL
            form = get_object_or_404(PmForms, pmformcode=pmformcode)
            form.delete()
            return Response(
                {"status": "success", "message": "Form deleted successfully"}
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST", "GET", "PUT"])
@permission_classes([AllowAny])
def FormListCreate(request):
    if request.method == "PUT":
        try:
            formcode = request.data.get("formcode")
            if not formcode:
                return Response(
                    {"status": "error", "message": "Form code is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            form = get_object_or_404(SubmitForm, formcode=formcode)

            # Check if this user already has a note on this form
            if form.formnote_user and form.formnote_user != request.user:
                return Response(
                    {
                        "status": "error",
                        "message": "Another user has already added a note",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check if user has already edited their note
            if form.formnote_user == request.user and form.formnote_edited:
                return Response(
                    {"status": "error", "message": "You can only edit your note once"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            form.formnote = request.data.get("note", "")
            form.formnote_user = request.user
            if form.formnote_user == request.user and form.formnote:
                form.formnote_edited = True
            form.save(update_fields=["formnote", "formnote_user", "formnote_edited"])

            return Response(
                {
                    "status": "success",
                    "message": "Note updated successfully",
                    "form": {
                        "formcode": form.formcode,
                        "formnote": form.formnote,
                        "can_edit": not form.formnote_edited
                        and (
                            not form.formnote_user or form.formnote_user == request.user
                        ),
                    },
                }
            )
        except SubmitForm.DoesNotExist:
            return Response(
                {"status": "error", "message": "Form not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if request.method == "POST":
        try:
            # Extract data from request
            problemdate_str = request.data.get("problemdate")
            phase = request.data.get("phase", "01")
            machinename = request.data.get("machinename")
            machinecode = request.data.get("machinecode")
            machineplacecode = request.data.get("machineplacecode", "")
            worktype = request.data.get("worktype", "")
            stoptime_str = request.data.get("stoptime")
            failuretimesubmit = request.data.get("failuretimesubmit", None)
            operatorname = request.data.get("operatorname")
            productionstop = request.data.get("productionstop", False)
            section = request.data.get("section", "")
            shift = request.data.get("shift", "")
            suggesttime = request.data.get("suggesttime", None)
            worksuggest = request.data.get("worksuggest", "")
            fixrepair = request.data.get("fixrepair", "")
            reportinspection = request.data.get("reportinspection", "")
            faultdm = request.data.get("faultdm", "")
            problemdescription = request.data.get("problemdescription", "")
            formnote = request.data.get("formnote", "")
            stoptype = request.data.get("stoptype", "")

            # Convert timestamps
            try:
                if stoptime_str:
                    # Convert Persian date to Gregorian
                    persian_stoptime = jdatetime.datetime.strptime(
                        stoptime_str, "%Y/%m/%d %H:%M"
                    )
                    stoptime = persian_stoptime.togregorian()
                else:
                    stoptime = None

                if problemdate_str:
                    # Convert Persian date to Gregorian
                    persian_problemdate = jdatetime.datetime.strptime(
                        problemdate_str, "%Y/%m/%d %H:%M"
                    )
                    problemdate = persian_problemdate.togregorian()
                else:
                    problemdate = None
            except ValueError as e:
                return Response(
                    {
                        "status": "error",
                        "message": f"Invalid datetime format: {str(e)}",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate required fields
            if not operatorname or not shift or not machinename or not phase:
                return Response(
                    {"status": "error", "message": "Required fields are missing"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            section_code = SECTION_CODES.get(section, "01")

            # Generate formcode using the standardized function from utils
            from .utils import generate_formcode

            base_formcode = generate_formcode(phase, section_code, problemdate)

            # Find the last form with this base formcode and increment the sequence
            last_form = (
                SubmitForm.objects.filter(formcode__startswith=base_formcode)
                .order_by("-formcode")
                .first()
            )

            if last_form:
                last_number = int(last_form.formcode[-2:])
                new_last_two = str(last_number + 1).zfill(2)
                if last_number >= 99:
                    return Response(
                        {
                            "status": "error",
                            "message": "Reached maximum formcode limit",
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                formcode = base_formcode + new_last_two
            else:
                formcode = base_formcode + "01"

            # Delete existing form if it exists
            SubmitForm.objects.filter(formcode=formcode).delete()

            # Save to database
            try:
                form = SubmitForm.objects.create(
                    formcode=formcode,
                    problemdate=problemdate,
                    phase=phase,
                    machinename=machinename,
                    machinecode=machinecode,
                    machineplacecode=machineplacecode,
                    worktype=worktype,
                    stoptime=stoptime,
                    failuretimesubmit=failuretimesubmit,
                    operatorname=operatorname,
                    productionstop=productionstop,
                    section=section,
                    shift=shift,
                    suggesttime=suggesttime,
                    worksuggest=worksuggest,
                    fixrepair=fixrepair,
                    reportinspection=reportinspection,
                    faultdm=faultdm,
                    problemdescription=problemdescription,
                    formnote=formnote,
                    stoptype=stoptype,
                )
                return Response(
                    {
                        "status": "success",
                        "message": "Form submitted successfully",
                        "formcode": formcode,
                    }
                )
            except Exception as e:
                return Response(
                    {"status": "error", "message": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            print(f"Error in FormListCreate: {str(e)}")  # Add debug logging
            return Response({"status": "error", "message": str(e)}, status=500)

    elif request.method == "GET":
        # Get all forms
        forms = SubmitForm.objects.all()
        serializer = SubmitFormSerializer(forms, many=True)
        return Response(serializer.data)


@api_view(["POST", "GET", "PUT"])
@permission_classes([AllowAny])
def TechnicianFormSubmit(request):
    if request.method == "POST":
        try:
            # Extract data from request
            formcode = request.data.get("formcode")
            failurepart = request.data.get("failurepart", "")
            failuretime = request.data.get("failuretime")
            sparetime = request.data.get("sparetime")
            startfailuretime = request.data.get("startfailuretime", "0")
            problemdescription = request.data.get("problemdescription", "")
            wastedtime = request.data.get("wastedtime", "0")
            jobstatus = request.data.get("jobstatus", "در حال انجام").strip()

            # Retrieve SubmitForm instance
            try:
                form = SubmitForm.objects.get(formcode=formcode)
            except SubmitForm.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Form not found"}, status=404
                )

            # Delete existing technician submission if it exists
            existing_submission = TechnicianSubmit.objects.filter(
                formcode=formcode
            ).first()
            if existing_submission:
                existing_submission.delete()

            # Create and save TechnicianSubmit instance
            submission = TechnicianSubmit.objects.create(
                formcode=formcode,
                failurepart=failurepart,
                failuretime=failuretime if failuretime else None,
                sparetime=sparetime if sparetime else None,
                wastedtime=wastedtime if wastedtime else None,
                startfailuretime=startfailuretime,
                problemdescription=problemdescription,
                jobstatus=jobstatus,
            )

            # Update form status
            form.status = form.get_next_status(request.user)
            form.save()

            return Response(
                {
                    "status": "success",
                    "message": "Form submitted successfully",
                    "technician_status": form.status,
                    "jobstatus": submission.jobstatus,
                }
            )

        except Exception as e:
            print(f"Error in TechnicianFormSubmit: {str(e)}")  # Add debug logging
            return Response({"status": "error", "message": str(e)}, status=500)
    elif request.method == "GET":
        # Get all technician submissions
        submissions = TechnicianSubmit.objects.all()
        serializer = TechnicianSubmitSerializer(submissions, many=True)
        return Response(serializer.data)
    elif request.method == "PUT":
        try:
            # Extract data from request
            formcode = request.data.get("formcode")
            failurepart = request.data.get("failurepart", "")
            failuretime = request.data.get("failuretime")
            sparetime = request.data.get("sparetime")
            startfailuretime = request.data.get("startfailuretime", "0")
            problemdescription = request.data.get("problemdescription", "")
            wastedtime = request.data.get("wastedtime", "0")
            jobstatus = request.data.get("jobstatus", "در حال انجام").strip()

            # Retrieve SubmitForm instance
            try:
                form = SubmitForm.objects.get(formcode=formcode)
            except SubmitForm.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Form not found"}, status=404
                )

            # Get existing technician submission
            try:
                submission = TechnicianSubmit.objects.get(formcode=formcode)
            except TechnicianSubmit.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Technician submission not found"},
                    status=404,
                )

            # Update the submission
            submission.failurepart = failurepart
            submission.failuretime = failuretime if failuretime else None
            submission.sparetime = sparetime if sparetime else None
            submission.wastedtime = wastedtime if wastedtime else None
            submission.startfailuretime = startfailuretime
            submission.problemdescription = problemdescription
            submission.jobstatus = jobstatus
            submission.save()

            return Response(
                {
                    "status": "success",
                    "message": "Technician submission updated successfully",
                    "jobstatus": submission.jobstatus,
                }
            )

        except Exception as e:
            print(f"Error in TechnicianFormSubmit PUT: {str(e)}")  # Add debug logging
            return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def AghlamSubmit(request):
    if request.method == "POST":
        # Extract data
        formcode = request.data.get("formcode")
        kalaname = request.data.get("kalaname")
        countkala = request.data.get("countkala")
        vahedkala = request.data.get("vahedkala")
        codekala = request.data.get("codekala")
        flamekala = request.data.get("flamekala")

        # Validate required fields
        if not kalaname or not countkala or not vahedkala:
            return Response(
                {"status": "error", "message": "Required fields are missing"},
                status=400,
            )
        # Create and save form entry
        try:
            aghlamform = Aghlam.objects.create(
                formcode=formcode,
                kalaname=kalaname,
                countkala=countkala,
                vahedkala=vahedkala,
                codekala=codekala,
                flamekala=flamekala,
            )
            return Response(
                {"status": "success", "message": "Form submitted successfully"}
            )
        except Exception as e:
            # Log the error and return it in the response
            print(f"Error saving Aghlam: {e}")
            return Response({"status": "error", "message": str(e)}, status=500)
    elif request.method == "GET":
        submissions = Aghlam.objects.all().values()
        return Response({"status": "success", "data": list(submissions)})


# Pm Aghlam Submit
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def PmAghlamSubmit(request):
    if request.method == "POST":
        # Extract data
        pmformcode = request.data.get("pmformcode")
        kalaname = request.data.get("kalaname")
        countkala = request.data.get("countkala")
        vahedkala = request.data.get("vahedkala")
        codekala = request.data.get("codekala")

        # Validate required fields
        if not kalaname or not countkala or not vahedkala:
            return Response(
                {"status": "error", "message": "Required fields are missing"},
                status=400,
            )
        # Create and save form entry
        try:
            pmaghlamform = PmAghlam.objects.create(
                pmformcode=pmformcode,
                kalaname=kalaname,
                countkala=countkala,
                vahedkala=vahedkala,
                codekala=codekala,
            )
            return Response(
                {"status": "success", "message": "Form submitted successfully"}
            )
        except Exception as e:
            # Log the error and return it in the response
            print(f"Error saving PMAghlam: {e}")
            return Response({"status": "error", "message": str(e)}, status=500)
    elif request.method == "GET":
        # Get the pmformcode from query parameters if provided
        pmformcode = request.query_params.get("pmformcode")

        # Filter by pmformcode if provided
        if pmformcode:
            submissions = PmAghlam.objects.filter(pmformcode=pmformcode).values()
        else:
            submissions = PmAghlam.objects.all().values()

        return Response(list(submissions))


# Get PmAghlam by FormCode
@api_view(["GET"])
@permission_classes([AllowAny])
def PmAghlamByFormCode(request, pmformcode):
    try:
        aghlams = PmAghlam.objects.filter(pmformcode=pmformcode)
        serializer = PmAghlamSerializer(aghlams, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Pm Personel Submit
@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def PmPersonelSubmit(request):
    if request.method == "POST":
        # Extract data
        pmformcode = request.data.get("pmformcode", "")
        personel = request.data.get("personel", "")
        personelnumber = request.data.get("personelnumber", "")
        specialjob = request.data.get("specialjob", "")
        starttimerepair = request.data.get("starttimerepair", "")
        endtimerepair = request.data.get("endtimerepair", "")
        unitrepair = request.data.get("unitrepair", "")
        shift = request.data.get("shift", "")
        submit_form = request.data.get("submit_form")

        # Validate required fields
        if not personel or not personelnumber:
            return Response(
                {"status": "error", "message": "Required fields are missing"},
                status=400,
            )

        def parse_datetime(dt_str):
            try:
                if not dt_str:
                    return None

                # Try parsing as ISO format first
                try:
                    return timezone.make_aware(
                        datetime.datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
                    )
                except ValueError:
                    # If ISO format fails, try other formats
                    try:
                        return timezone.make_aware(
                            datetime.datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                        )
                    except ValueError:
                        try:
                            return timezone.make_aware(
                                datetime.datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ")
                            )
                        except ValueError:
                            return None
            except Exception as e:
                print(f"Error parsing datetime: {str(e)}")
                return None

        starttimerepair = parse_datetime(starttimerepair)
        endtimerepair = parse_datetime(endtimerepair)

        # Create and save form entry
        try:
            # Check if a PmPersonel record with this pmformcode already exists
            existing_personel = PmPersonel.objects.filter(pmformcode=pmformcode).first()

            if existing_personel:
                # Determine which slot to fill (personel2 through personel8)
                if not existing_personel.personel2:
                    # Fill personel2
                    existing_personel.personel2 = personel
                    existing_personel.personelnumber2 = personelnumber
                    existing_personel.specialjob2 = specialjob
                    existing_personel.starttimerepair2 = starttimerepair
                    existing_personel.endtimerepair2 = endtimerepair
                    slot = 2
                elif not existing_personel.personel3:
                    # Fill personel3
                    existing_personel.personel3 = personel
                    existing_personel.personelnumber3 = personelnumber
                    existing_personel.specialjob3 = specialjob
                    existing_personel.starttimerepair3 = starttimerepair
                    existing_personel.endtimerepair3 = endtimerepair
                    slot = 3
                elif not existing_personel.personel4:
                    # Fill personel4
                    existing_personel.personel4 = personel
                    existing_personel.personelnumber4 = personelnumber
                    existing_personel.specialjob4 = specialjob
                    existing_personel.starttimerepair4 = starttimerepair
                    existing_personel.endtimerepair4 = endtimerepair
                    slot = 4
                elif not existing_personel.personel5:
                    # Fill personel5
                    existing_personel.personel5 = personel
                    existing_personel.personelnumber5 = personelnumber
                    existing_personel.specialjob5 = specialjob
                    existing_personel.starttimerepair5 = starttimerepair
                    existing_personel.endtimerepair5 = endtimerepair
                    slot = 5
                elif not existing_personel.personel6:
                    # Fill personel6
                    existing_personel.personel6 = personel
                    existing_personel.personelnumber6 = personelnumber
                    existing_personel.specialjob6 = specialjob
                    existing_personel.starttimerepair6 = starttimerepair
                    existing_personel.endtimerepair6 = endtimerepair
                    slot = 6
                elif not existing_personel.personel7:
                    # Fill personel7
                    existing_personel.personel7 = personel
                    existing_personel.personelnumber7 = personelnumber
                    existing_personel.specialjob7 = specialjob
                    existing_personel.starttimerepair7 = starttimerepair
                    existing_personel.endtimerepair7 = endtimerepair
                    slot = 7
                elif not existing_personel.personel8:
                    # Fill personel8
                    existing_personel.personel8 = personel
                    existing_personel.personelnumber8 = personelnumber
                    existing_personel.specialjob8 = specialjob
                    existing_personel.starttimerepair8 = starttimerepair
                    existing_personel.endtimerepair8 = endtimerepair
                    slot = 8
                else:
                    # All slots are filled
                    return Response(
                        {
                            "status": "error",
                            "message": "All personnel slots are already filled for this form",
                        },
                        status=400,
                    )

                # Update other fields if they're provided
                if unitrepair:
                    existing_personel.unitrepair = unitrepair
                if shift:
                    existing_personel.shift = shift
                existing_personel.save()

                return Response(
                    {
                        "status": "success",
                        "message": f"Personnel added to slot {slot} successfully",
                        "slot": slot,
                    }
                )
            else:
                # Create a new Personel record with the first slot
                pmpersonelform = PmPersonel.objects.create(
                    pmformcode=pmformcode,
                    personel=personel,
                    personelnumber=personelnumber,
                    specialjob=specialjob,
                    starttimerepair=starttimerepair,
                    endtimerepair=endtimerepair,
                    unitrepair=unitrepair,
                    shift=shift,
                )

                # If submit_form is provided, try to link it to a PmForms instance
                if submit_form:
                    try:
                        pm_form = PmForms.objects.get(pmformcode=pmformcode)
                        pmpersonelform.pm_submit = pm_form
                        pmpersonelform.save()
                    except PmForms.DoesNotExist:
                        pass
                return Response(
                    {
                        "status": "success",
                        "message": "Form submitted successfully",
                        "slot": 1,
                    }
                )
        except Exception as e:
            # Log the error and return it in the response
            print(f"Error saving PmPersonel: {e}")
            return Response({"status": "error", "message": str(e)}, status=500)
    elif request.method == "GET":
        # Get the pmformcode from query parameters if provided
        pmformcode = request.query_params.get("pmformcode")

        # Filter by pmformcode if provided
        if pmformcode:
            submissions = PmPersonel.objects.filter(pmformcode=pmformcode).values()
        else:
            submissions = PmPersonel.objects.all().values()

        return Response(list(submissions))


# Get PmPersonel by FormCode
@api_view(["GET"])
@permission_classes([AllowAny])
def PmPersonelByFormCode(request, pmformcode):
    try:
        personels = PmPersonel.objects.filter(pmformcode=pmformcode)
        serializer = PmPersonelSerializer(personels, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST", "GET", "PUT"])
@permission_classes([AllowAny])
def PersonelSubmit(request):
    if request.method == "POST":
        # Normalize input
        formcode = str(request.data.get("formcode", "")).strip().lower()
        personel = request.data.get("personel", "")
        personelnumber = request.data.get("personelnumber", "")
        specialjob = request.data.get("specialjob", "")
        starttimerepair_str = request.data.get("starttimerepair")
        endtimerepair_str = request.data.get("endtimerepair")
        repairstatus = request.data.get("repairstatus", "")
        unitrepair = request.data.get("unitrepair", "")
        shift = request.data.get("shift", "")
        delayreason = request.data.get("delayreason", "")
        failurereason = request.data.get("failurereason", "")
        failurereasondescription = request.data.get("failurereasondescription", "")
        suggestionfailure = request.data.get("suggestionfailure", "")
        submit_form = request.data.get("submit_form")

        # Validate required fields
        if not personel or not personelnumber or not failurereasondescription:
            return Response(
                {"status": "error", "message": "Required fields are missing"},
                status=400,
            )

        # Parse datetime fields
        try:
            if starttimerepair_str:
                # Try parsing as ISO format first
                try:
                    starttimerepair = timezone.make_aware(
                        datetime.datetime.fromisoformat(
                            starttimerepair_str.replace("Z", "+00:00")
                        )
                    )
                except ValueError:
                    # If ISO format fails, try other formats
                    try:
                        starttimerepair = timezone.make_aware(
                            datetime.datetime.strptime(
                                starttimerepair_str, "%Y-%m-%dT%H:%M:%S.%fZ"
                            )
                        )
                    except ValueError:
                        try:
                            starttimerepair = timezone.make_aware(
                                datetime.datetime.strptime(
                                    starttimerepair_str, "%Y-%m-%dT%H:%M:%SZ"
                                )
                            )
                        except ValueError:
                            return Response(
                                {
                                    "status": "error",
                                    "message": "Invalid datetime format for starttimerepair",
                                },
                                status=400,
                            )
            else:
                starttimerepair = None

            if endtimerepair_str:
                # Try parsing as ISO format first
                try:
                    endtimerepair = timezone.make_aware(
                        datetime.datetime.fromisoformat(
                            endtimerepair_str.replace("Z", "+00:00")
                        )
                    )
                except ValueError:
                    # If ISO format fails, try other formats
                    try:
                        endtimerepair = timezone.make_aware(
                            datetime.datetime.strptime(
                                endtimerepair_str, "%Y-%m-%dT%H:%M:%S.%fZ"
                            )
                        )
                    except ValueError:
                        try:
                            endtimerepair = timezone.make_aware(
                                datetime.datetime.strptime(
                                    endtimerepair_str, "%Y-%m-%dT%H:%M:%SZ"
                                )
                            )
                        except ValueError:
                            return Response(
                                {
                                    "status": "error",
                                    "message": "Invalid datetime format for endtimerepair",
                                },
                                status=400,
                            )
            else:
                endtimerepair = None
        except Exception as e:
            return Response(
                {
                    "status": "error",
                    "message": f"Error parsing datetime: {str(e)}",
                },
                status=400,
            )

        try:
            # Try to find existing record by formcode
            existing_qs = Personel.objects.filter(formcode=formcode)
            existing_personel = existing_qs.order_by("-id").first()

            if existing_personel:
                # Add to next available slot (2 to 8)
                slot = None
                for i in range(2, 9):
                    if not getattr(existing_personel, f"personel{i}"):
                        setattr(existing_personel, f"personel{i}", personel)
                        setattr(existing_personel, f"personelnumber{i}", personelnumber)
                        setattr(existing_personel, f"specialjob{i}", specialjob)
                        setattr(
                            existing_personel, f"starttimerepair{i}", starttimerepair
                        )
                        setattr(existing_personel, f"endtimerepair{i}", endtimerepair)
                        slot = i
                        break

                if not slot:
                    return Response(
                        {
                            "status": "error",
                            "message": "All personnel slots are already filled",
                        },
                        status=400,
                    )

                # Update shared fields if provided
                update_fields = {
                    "repairstatus": repairstatus,
                    "unitrepair": unitrepair,
                    "shift": shift,
                    "delayreason": delayreason,
                    "failurereason": failurereason,
                    "failurereasondescription": failurereasondescription,
                    "suggestionfailure": suggestionfailure,
                }
                for field, value in update_fields.items():
                    if value:
                        setattr(existing_personel, field, value)

                existing_personel.save()
                return Response(
                    {
                        "status": "success",
                        "message": f"Personnel saved to slot {slot}",
                        "slot": slot,
                    }
                )
            else:
                # Create new record and store in base slot
                new_personel = Personel.objects.create(
                    formcode=formcode,
                    personel=personel,
                    personelnumber=personelnumber,
                    specialjob=specialjob,
                    starttimerepair=starttimerepair,
                    endtimerepair=endtimerepair,
                    repairstatus=repairstatus,
                    unitrepair=unitrepair,
                    shift=shift,
                    delayreason=delayreason,
                    failurereason=failurereason,
                    failurereasondescription=failurereasondescription,
                    suggestionfailure=suggestionfailure,
                    submit_form=submit_form,
                )
                return Response(
                    {
                        "status": "success",
                        "message": "Form submitted successfully",
                        "slot": 1,
                    }
                )

        except Exception as e:
            print("Unhandled error:", e)
            return Response({"status": "error", "message": str(e)}, status=500)

    elif request.method == "GET":
        all_data = Personel.objects.all().values()
        return Response({"status": "success", "data": list(all_data)})
    elif request.method == "PUT":
        try:
            formcode = request.data.get("formcode")
            if not formcode:
                return Response(
                    {"status": "error", "message": "Form code is required"},
                    status=400,
                )

            try:
                personel = Personel.objects.get(formcode=formcode)
            except Personel.DoesNotExist:
                return Response(
                    {"status": "error", "message": "Personnel record not found"},
                    status=404,
                )

            def parse_datetime(dt_str):
                if not dt_str:
                    return None
                try:
                    try:
                        return timezone.make_aware(
                            datetime.datetime.fromisoformat(
                                dt_str.replace("Z", "+00:00")
                            )
                        )
                    except ValueError:
                        try:
                            return timezone.make_aware(
                                datetime.datetime.strptime(
                                    dt_str, "%Y-%m-%dT%H:%M:%S.%fZ"
                                )
                            )
                        except ValueError:
                            try:
                                return timezone.make_aware(
                                    datetime.datetime.strptime(
                                        dt_str, "%Y-%m-%dT%H:%M:%SZ"
                                    )
                                )
                            except ValueError:
                                return None
                except Exception as e:
                    print(f"Error parsing datetime: {str(e)}")
                    return None

            fields_to_update = [
                "personel",
                "personelnumber",
                "specialjob",
                "personel2",
                "personelnumber2",
                "specialjob2",
                "personel3",
                "personelnumber3",
                "specialjob3",
                "personel4",
                "personelnumber4",
                "specialjob4",
                "personel5",
                "personelnumber5",
                "specialjob5",
                "personel6",
                "personelnumber6",
                "specialjob6",
                "personel7",
                "personelnumber7",
                "specialjob7",
                "personel8",
                "personelnumber8",
                "specialjob8",
                "repairstatus",
                "unitrepair",
                "shift",
                "delayreason",
                "failurereason",
                "failurereasondescription",
                "suggestionfailure",
            ]

            for field in fields_to_update:
                if field in request.data:
                    setattr(personel, field, request.data[field])

            datetime_fields = [
                "starttimerepair",
                "endtimerepair",
                "starttimerepair2",
                "endtimerepair2",
                "starttimerepair3",
                "endtimerepair3",
                "starttimerepair4",
                "endtimerepair4",
                "starttimerepair5",
                "endtimerepair5",
                "starttimerepair6",
                "endtimerepair6",
                "starttimerepair7",
                "endtimerepair7",
                "starttimerepair8",
                "endtimerepair8",
            ]

            for field in datetime_fields:
                if field in request.data:
                    parsed_datetime = parse_datetime(request.data[field])
                    if parsed_datetime is not None:
                        setattr(personel, field, parsed_datetime)

            personel.save()
            serializer = PersonelSerializer(personel)
            return Response(
                {
                    "status": "success",
                    "message": "Personnel data updated successfully",
                    "data": serializer.data,
                }
            )

        except Exception as e:
            print(f"Error updating personnel data: {str(e)}")
            return Response({"status": "error", "message": str(e)}, status=500)


class SubmitFormListView(APIView):
    permission_classes = [
        AllowAny
    ]  # This allows access to all users, authenticated or not

    def get(self, request):
        forms = SubmitForm.objects.all()
        serializer = SubmitFormSerializer(forms, many=True)
        return Response(serializer.data)


class TechnicianFormListView(APIView):
    permission_classes = [
        AllowAny
    ]  # This allows access to all users, authenticated or not

    def get(self, request):
        forms = TechnicianSubmit.objects.all()
        serializer = TechnicianSubmitSerializer(forms, many=True)
        return Response(serializer.data)


class AghlamsFormListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        aghlamform = Aghlam.objects.all()
        serializer = AghlamSerializer(aghlamform, many=True)
        print("Aghlam API Response:", serializer.data)  # Log the API response to check
        return Response(serializer.data)


class PersonelsFormListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Get the formcode from query parameters if provided
        formcode = request.query_params.get("formcode")

        # Filter by formcode if provided
        if formcode:
            personelforms = Personel.objects.filter(formcode=formcode)
        else:
            personelforms = Personel.objects.all()

        serializer = PersonelSerializer(personelforms, many=True)
        print(
            "Personel API Response:", serializer.data
        )  # Log the API response to check
        return Response(serializer.data)


@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_form(request, pk):
    try:
        form = get_object_or_404(SubmitForm, pk=pk)

        # Logging before deletion (for debugging)
        logger.info(f"Deleting SubmitForm ID: {pk}")

        # Delete related records explicitly (not required if CASCADE is set, but ensures cleanup)
        deleted_technicians = Personel.objects.filter(submit_form=form).delete()
        deleted_aghlams = Aghlam.objects.filter(submit_form=form).delete()
        deleted_technician_submits = TechnicianSubmit.objects.filter(
            submit_form=form
        ).delete()

        logger.info(f"Deleted related TechnicianPersonel: {deleted_technicians}")
        logger.info(f"Deleted related Aghlam: {deleted_aghlams}")
        logger.info(f"Deleted related TechnicianSubmit: {deleted_technician_submits}")

        # Now delete the SubmitForm itself
        form.delete()

        return Response(
            {"message": "Form and related records deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )

    except SubmitForm.DoesNotExist:
        return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error deleting form {pk}: {str(e)}")
        return Response(
            {"error": "Internal Server Error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
def delete_pm_form(request, pmformcode):
    try:
        pm_form = PmForms.objects.get(pmformcode=pmformcode)
        pm_form.delete()
        return Response(
            {"message": "Form deleted successfully"}, status=status.HTTP_204_NO_CONTENT
        )
    except PmForms.DoesNotExist:
        return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IsPm(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.groups.filter(name="pm").exists()
        )


class FormDelete(generics.DestroyAPIView):
    queryset = SubmitForm.objects.all()
    serializer_class = SubmitFormSerializer
    permission_classes = [AllowAny]


class PmFormDelete(generics.DestroyAPIView):
    queryset = PmForms.objects.all()
    serializer_class = PmFormsSerializer
    permission_classes = [AllowAny]


class SendDataView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            user_type = request.data.get("user_type")
            form_data = request.data.get("form_data")

            if not user_type:
                return Response(
                    {"error": "User type is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if user_type == "mechanic":
                pass
            elif user_type == "electric":
                pass
            elif user_type == "generalmechanic":
                pass
            elif user_type == "production":
                pass
            elif user_type == "utility":
                pass
            elif user_type == "tarashkari":
                pass
            elif user_type == "metalworking":
                pass
            elif user_type == "paint":
                pass
            else:
                return Response(
                    {"error": "Invalid user type."}, status=status.HTTP_400_BAD_REQUEST
                )

            return Response(
                {"message": "Data sent successfully."}, status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    try:
        # Ensure we're getting JSON data
        if not request.data:
            return Response(
                {"status": "error", "message": "No data provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"status": "error", "message": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate user
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {"status": "error", "message": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)

        # Get user info
        user_info = {
            "status": "success",
            "token": token.key,
            "user_type": user.user_type,
            "role": user.role,
            "sections": user.sections,
        }

        return Response(user_info, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return Response(
            {"status": "error", "message": "An error occurred during login"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def register_view(request):
    try:
        # Get data from request
        username = request.data.get("username")
        password = request.data.get("password")
        user_type = request.data.get("user_type")
        role = request.data.get("sub_user_type")  # Get role from sub_user_type
        sections = request.data.get("sections", [])  # Get sections from request

        # Validate required fields
        if not username or not password or not user_type:
            return Response(
                {"status": "error", "message": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate user type
        if user_type not in [
            "pm",
            "mechanic",
            "generalmechanic",
            "electric",
            "utility",
            "production",
            "metalworking",
            "tarashkari",
            "paint",
        ]:
            return Response(
                {"status": "error", "message": "Invalid user type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate role
        if role not in ["technician", "management", "operator"]:
            return Response(
                {"status": "error", "message": "Invalid role"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"status": "error", "message": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure sections is a list
        if not isinstance(sections, list):
            sections = [sections] if sections else []

        # Create new user
        user = User.objects.create_user(
            username=username,
            password=password,
            user_type=user_type,
            role=role,
            sections=sections,
        )

        # Generate token for the new user
        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "status": "success",
                "message": "User registered successfully",
                "token": token.key,
                "user_type": user_type,
                "role": role,
                "sections": sections,
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class SubmitFormViewSet(viewsets.ModelViewSet):
    queryset = SubmitForm.objects.all()
    serializer_class = SubmitFormSerializer
    lookup_field = "formcode"
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"])
    def technician_submits(self, request, formcode=None):
        """Get all technician submissions for a form"""
        form = self.get_object()
        technician_submits = form.technician_submit.all()
        serializer = TechnicianSubmitSerializer(technician_submits, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def aghlam(self, request, formcode=None):
        """Get all aghlam entries for a form"""

        form = self.get_object()
        aghlam = form.aghlam.all()
        serializer = AghlamSerializer(aghlam, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def personel(self, request, formcode=None):
        """Get all personel entries for a form"""
        form = self.get_object()
        personel = form.personel.all()
        serializer = PersonelSerializer(personel, many=True)
        return Response(serializer.data)

    def get_queryset(self):
        """
        Filter forms based on user role and type
        """
        queryset = SubmitForm.objects.all()
        user = self.request.user

        if not user.is_authenticated:
            return SubmitForm.objects.none()

        if user.user_type == "pm":
            return queryset
        elif user.user_type == "production" and user.role == "management":
            return queryset.filter(status="management_approved")
        elif user.user_type == "production" and user.role == "operator":
            return queryset
        elif user.role == "management":
            return queryset.filter(
                worktype=user.user_type,
                status__in=["technician_submitted", "pending_technician"],
            )
        elif user.role == "technician":
            return queryset.filter(worktype=user.user_type, status="pending_technician")

        return queryset


class FormListByRole(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        forms = []

        if user.sub_user_type == "operator" and user.user_type == "production":
            # Production operators see forms they created and forms pending their confirmation
            forms = SubmitForm.objects.filter(
                created_by=user
            ) | SubmitForm.objects.filter(status="pending_production")

        elif user.sub_user_type == "technician":
            # Technicians see forms assigned to their department pending technician review
            forms = SubmitForm.objects.filter(
                status="pending_technician", assigned_department=user.user_type
            )

        elif user.sub_user_type == "management":
            # Management sees forms from their department pending their approval
            forms = SubmitForm.objects.filter(
                status="pending_management", assigned_department=user.user_type
            )

        elif user.sub_user_type == "management" and user.user_type == "production":
            # PM sees all forms pending their review
            forms = SubmitForm.objects.filter(status="pending_pm")

        serializer = SubmitFormSerializer(forms, many=True)
        return Response(serializer.data)


@api_view(["POST"])
@permission_classes(
    [IsAuthenticated]
)  # Changed from IsPm to IsAuthenticated for debugging
def update_form_type(request, formcode):
    """
    Update just the form type for a specific form by formcode.
    Only accessible by PM users.
    """
    try:
        # Log user information for debugging
        print(
            f"User: {request.user}, Authenticated: {request.user.is_authenticated}, User Type: {getattr(request.user, 'user_type', 'N/A')}"
        )

        # Manual check for PM user
        if not (
            request.user.is_authenticated
            and getattr(request.user, "user_type", "") == "pm"
        ):
            return Response(
                {"error": "Only PM users can update form type"},
                status=status.HTTP_403_FORBIDDEN,
            )

        form = SubmitForm.objects.get(formcode=formcode)
        form_type = request.data.get("formtype")

        if not form_type:
            return Response(
                {"error": "Form type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if form.status not in ["pending_pm", "production_management_confirm"]:
            return Response(
                {
                    "error": "Can only update form type when status is pending PM review or PM technician pending"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        print("\n=== PM Form Completion Debug ===")
        print(f"Form Code: {formcode}")
        print(f"Current Status: {form.status}")
        print(f"Current PM Confirmation Date: {form.pm_confirmation_date}")
        print(f"Setting Form Type: {form_type}")
        print(f"Setting Form name: {form.pm_confirmation_name}")
        print(f"Setting Status: completed")
        print(f"Setting PM Confirmation Date: {timezone.now()}")
        print("=============================\n")

        # Update all fields at once
        form_data = {
            "formtype": form_type,
            "status": "completed",
            "pm_confirmation_date": timezone.now(),
            "updated_at": timezone.now(),
        }

        for field, value in form_data.items():
            setattr(form, field, value)

        form.save(update_fields=list(form_data.keys()))

        # Verify the changes
        updated_form = SubmitForm.objects.get(formcode=formcode)
        print("\n=== Form Update Verification ===")
        print(f"Updated Status: {updated_form.status}")
        print(f"Updated PM Confirmation Date: {updated_form.pm_confirmation_date}")
        print(f"Updated Form Type: {updated_form.formtype}")
        print("=============================\n")

        serializer = SubmitFormSerializer(form)
        print("\n=== Serialized Data ===")
        print(
            f"Serialized PM Confirmation Date: {serializer.data.get('pm_confirmation_date')}"
        )
        print("=============================\n")

        return Response(serializer.data)

    except SubmitForm.DoesNotExist:
        return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error in update_form_type: {str(e)}")
        return Response(
            {"error": f"Error updating form type: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_form_status(request, formcode):
    try:
        form = SubmitForm.objects.get(formcode=formcode)
        action = request.data.get("action")
        user = request.user

        # Mapping (status, action, user_type, user_role) to next status
        transition_map = {
            # Step 1: Technician submits the form
            (
                "pending_technician",
                "technician_submit",
                "mechanic",
                "technician",
            ): "technician_submitted",
            (
                "pending_technician",
                "technician_submit",
                "generalmechanic",
                "technician",
            ): "technician_submitted",
            (
                "pending_technician",
                "technician_submit",
                "electric",
                "technician",
            ): "technician_submitted",
            (
                "pending_technician",
                "technician_submit",
                "utility",
                "technician",
            ): "technician_submitted",
            (
                "pending_technician",
                "technician_submit",
                "metalworking",
                "technician",
            ): "technician_submitted",
            (
                "pending_technician",
                "technician_submit",
                "paint",
                "technician",
            ): "technician_submitted",
            (
                "pending_technician",
                "technician_submit",
                "tarashkari",
                "technician",
            ): "technician_submitted",
            # Step 2: Production operator receives the form
            (
                "technician_submitted",
                "production_confirm",
                "production",
                "operator",
            ): "production_confirmed",
            # Set status to pending_production before confirmation
            (
                "technician_submitted",
                "update_endtime",
                "production",
                "operator",
            ): "pending_production",
            # Step 3: Production operator confirms
            (
                "pending_production",
                "production_confirm",
                "production",
                "operator",
            ): "production_confirmed",
            # Step 4: After production confirmation, forward to management
            (
                "production_confirmed",
                "management_approve",
                "mechanic",
                "management",
            ): "management_approved",
            (
                "production_confirmed",
                "management_approve",
                "electric",
                "management",
            ): "management_approved",
            (
                "production_confirmed",
                "management_approve",
                "utility",
                "management",
            ): "management_approved",
            (
                "production_confirmed",
                "management_approve",
                "generalmechanic",
                "management",
            ): "management_approved",
            (
                "production_confirmed",
                "management_approve",
                "metalworking",
                "management",
            ): "management_approved",
            (
                "production_confirmed",
                "management_approve",
                "tarashkari",
                "management",
            ): "management_approved",
            (
                "production_confirmed",
                "management_approve",
                "paint",
                "management",
            ): "management_approved",
            # Step 5: After management approved, production management reviews
            (
                "management_approved",
                "production_management_confirm",
                "production",
                "management",
            ): "production_management_confirm",
            # Step 6: After production management, pending PM
            (
                "production_management_confirm",
                "pm_technician_submit",
                "pm",
                "technician",
            ): "pending_pm",
            # Step 7: PM reviews, goes to completed/rejected
            ("pending_pm", "pm_complete", "pm", "management"): "completed",
            ("pending_pm", "pm_reject", "pm", "management"): "rejected",
        }

        key = (form.status, action, user.user_type, user.role)
        new_status = transition_map.get(key)

        if not new_status:
            return Response(
                {
                    "status": "error",
                    "message": f"Invalid action '{action}' for status '{form.status}', user type '{user.user_type}', role '{user.role}'.",
                },
                status=400,
            )

        # Special Handling for update_endtime
        if action == "update_endtime":
            # Set endtime from request and mark as updated
            endtime = request.data.get("endtime")
            if endtime:
                form.endtime = endtime
                form.endtime_updated = True

        form.status = new_status

        # Set relevant date fields if needed (optional)
        if new_status == "technician_submitted":
            form.technician_confirmation_date = timezone.now()
            form.technician_confirmation_name = user.get_full_name() or user.username
        elif new_status == "management_approved":
            form.management_confirmation_date = timezone.now()
            form.management_confirmation_name = user.get_full_name() or user.username
        elif new_status == "production_confirmed":
            form.operator_confirmation_date = timezone.now()
            form.operator_confirmation_name = user.get_full_name() or user.username
        elif new_status == "production_management_confirm":
            form.production_management_confirmation_date = timezone.now()
            form.production_management_confirmation_name = (
                user.get_full_name() or user.username
            )
        elif new_status == "completed":
            pm_name = user.get_full_name() or user.username
            print("DEBUG: Setting technician_confirmation_name =", pm_name)
            form.pm_confirmation_date = timezone.now()
            form.pm_confirmation_name = pm_name
            print(
                "DEBUG: Will be saved pm_confirmation_name =", form.pm_confirmation_name
            )

        form.save()
        return Response(
            {
                "status": "success",
                "message": f"Form status updated to {new_status}",
                "form": SubmitFormSerializer(form).data,
            }
        )

    except SubmitForm.DoesNotExist:
        return Response({"status": "error", "message": "Form not found"}, status=404)
    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_forms_by_role(request):
    """
    Get forms based on user role and department:

    - PM Management: Can see all forms
    - PM Technician: Can see forms in their assigned sections
    - Production Management: Can see forms that need production confirmation
    - Department Management: Can see forms assigned to their department
    - Technicians: Can see forms assigned to their department that need technician review
    - Operators: Can see forms they created
    """
    # For unauthenticated users, return empty list
    if not request.user.is_authenticated:
        return Response([])

    # Get user type and role from request headers if available
    user_type = request.META.get("HTTP_X_USER_TYPE", None)
    user_role = request.META.get("HTTP_X_USER_ROLE", None)

    # If not in headers, use authenticated user
    if not user_type:
        user_type = request.user.user_type

    if not user_role:
        user_role = getattr(request.user, "role", "operator")

    try:
        # Start with all incomplete forms
        forms = SubmitForm.objects.exclude(status="completed")

        # Handle sections whether they're a string or list
        if isinstance(request.user.sections, str):
            user_sections = request.user.sections.split(",")
        elif isinstance(request.user.sections, list):
            user_sections = request.user.sections
        else:
            user_sections = []

        print(f"\n=== Forms by Role Debug ===")
        print(f"User: {request.user.username}")
        print(f"User Type: {user_type}")
        print(f"User Role: {user_role}")
        print(f"User Sections: {user_sections}")
        print(f"Total incomplete forms: {forms.count()}")

        if user_type == "pm":
            if user_role == "management":
                # PM management sees all incomplete forms
                forms = forms.filter(
                    Q(
                        status__in=[
                            "pending_pm",
                            "production_confirmed",
                            "management_approved",
                            "pm_technician_pending",
                            "technician_submitted",
                            "pending_production",
                        ]
                    )
                )
                print(f"PM management - forms needing attention: {forms.count()}")
            else:
                # PM Technicians only see forms in their assigned sections
                if user_sections and "all" not in user_sections:
                    forms = forms.filter(section__in=user_sections)

                forms = forms.filter(
                    Q(
                        status__in=[
                            "pending_pm",
                            "production_confirmed",
                            "management_approved",
                            "pm_technician_pending",
                            "technician_submitted",
                            "pending_production",
                        ]
                    )
                )
                print(f"PM Technician - forms in assigned sections: {forms.count()}")
        elif user_type == "production":
            if user_role == "management":
                # Production management sees forms pending their review
                forms = forms.filter(
                    Q(status="management_approved")
                    | Q(status="production_confirmed")
                    | Q(status="pending_production")
                )
                print(f"Production management - forms pending review: {forms.count()}")
            elif user_role == "operator":
                # Production operators see forms pending their action
                forms = forms.filter(
                    Q(status="pending_production")
                    | Q(status="management_approved")
                    | Q(status="production_confirmed")
                )
                print(f"Production operator - forms pending action: {forms.count()}")
        elif user_type in [
            "mechanic",
            "electric",
            "utility",
            "metalworking",
            "tarashkari",
            "generalmechanic",
        ]:
            if user_role == "management":
                # Department management sees forms pending their review
                dept_forms = forms.filter(
                    Q(worktype=user_type)
                    & (
                        Q(status="technician_submitted")
                        | Q(status="pending_technician")
                        | Q(status="در حال بررسی")
                    )
                )
                print(
                    f"{user_type} management - forms pending review: {dept_forms.count()}"
                )
                print(
                    f"{user_type} management - form statuses: {list(dept_forms.values_list('status', flat=True).distinct())}"
                )
                count = dept_forms.count()
            else:
                # Technicians see forms pending their review
                tech_forms = forms.filter(
                    Q(status="pending_technician") & Q(worktype=user_type)
                )
                print(
                    f"Technician ({user_type}) - forms pending review: {tech_forms.count()}"
                )
                print(
                    f"Technician ({user_type}) - form statuses: {list(tech_forms.values_list('status', flat=True).distinct())}"
                )
                count = tech_forms.count()

        print(f"Final forms count: {forms.count()}")
        print("=============================\n")

        serializer = SubmitFormSerializer(forms, many=True)
        return Response(serializer.data)

    except Exception as e:
        print(f"Error in get_forms_by_role: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_info(request):
    """
    Get current user information including username, user_type, sections
    """
    if not request.user.is_authenticated:
        return Response(
            {
                "username": "",
                "user_type": "guest",
                "sections": [],
            }
        )

    user = request.user

    # Get user type from localStorage if available
    stored_user_type = request.META.get("HTTP_X_USER_TYPE", None)
    user_type = stored_user_type if stored_user_type else user.user_type

    return Response(
        {
            "username": user.username,
            "user_type": user_type,
            "sections": user.sections if hasattr(user, "sections") else [],
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_form_permissions(request, formcode):
    """
    Check if the current user has permission to update the form status
    """
    try:
        form = get_object_or_404(SubmitForm, formcode=formcode)
        user = request.user

        # Detailed logging for debugging
        print(f"=== Form Permission Check Debug ===")
        print(f"User: {user.username}")
        print(f"User Type: {user.user_type}")
        print(f"User Role: {user.role}")
        print(f"Form Code: {formcode}")
        print(f"Form Status: {form.status}")
        print("=============================")

        # Check if user is production operator and form is technician_submitted
        is_production_operator = (
            user.user_type == "production" and user.role == "operator"
        )
        is_technician_submitted = form.status == "technician_submitted"
        is_endtime_updated = form.endtime_updated

        can_update_endtime = (
            is_production_operator
            and is_technician_submitted
            and not is_endtime_updated
        )

        return Response(
            {
                "status": "success",
                "data": {
                    "permissions": {
                        "can_update_endtime": can_update_endtime,
                        "is_endtime_updated": is_endtime_updated,
                    },
                    "form": {
                        "status": form.status,
                        "endtime": form.endtime,
                        "endtime_updated": form.endtime_updated,
                    },
                    "user": {"type": user.user_type, "role": user.role},
                },
            }
        )

    except Exception as e:
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_form_permissions(request, formcode):
    try:
        form = SubmitForm.objects.get(formcode=formcode)
        user = request.user

        # Get user's role and type
        user_type = user.user_type
        user_role = user.role

        # Define permissions based on form status and user role
        permissions = {
            "can_view": True,  # All authenticated users can view
            "can_edit": False,
            "can_delete": False,
            "can_submit": False,
            "can_approve": False,
            "can_update_endtime": False,  # Add this new permission
        }

        # Set permissions based on form status and user role
        if form.status == "pending":
            if user_type == "technician" and user_role == "operator":
                permissions.update(
                    {
                        "can_edit": True,
                        "can_submit": True,
                    }
                )
            elif user_type == "mechanic" and user_role == "management":
                permissions.update(
                    {
                        "can_approve": True,
                    }
                )
        elif form.status == "submitted":
            if user_type == "mechanic" and user_role == "management":
                permissions.update(
                    {
                        "can_approve": True,
                    }
                )
        elif form.status == "technician_submitted":
            if user_type == "production" and user_role == "operator":
                permissions.update(
                    {
                        "can_update_endtime": True,
                    }
                )

        return Response(
            {
                "status": "success",
                "data": {
                    "permissions": permissions,
                    "form": {"status": form.status},
                    "user": {"type": user_type, "role": user_role},
                },
            }
        )

    except SubmitForm.DoesNotExist:
        return Response(
            {"status": "error", "message": "Form not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_pm_form_permissions(request, pmformcode):
    try:
        form = PmForms.objects.get(pmformcode=pmformcode)
        user = request.user

        # Get user's role and type
        user_type = user.user_type
        user_role = user.role

        # Define permissions based on form status and user role
        permissions = {
            "can_view": True,  # All authenticated users can view
            "can_edit": False,
            "can_delete": False,
            "can_submit": False,
            "can_approve": False,
            "can_update_endtime": False,  # Add this new permission
        }

        # Set permissions based on form status and user role
        if form.status == "pending":
            if user_type == "technician" and user_role == "operator":
                permissions.update(
                    {
                        "can_edit": True,
                        "can_submit": True,
                    }
                )
            elif user_type == "mechanic" and user_role == "management":
                permissions.update(
                    {
                        "can_approve": True,
                    }
                )
        elif form.status == "submitted":
            if user_type == "mechanic" and user_role == "management":
                permissions.update(
                    {
                        "can_approve": True,
                    }
                )
        elif form.status == "management_approved":
            if user_type == "production" and user_role == "operator":
                permissions.update(
                    {
                        "can_update_endtime": True,
                    }
                )

        return Response(
            {
                "status": "success",
                "data": {
                    "permissions": permissions,
                    "form": {"status": form.status},
                    "user": {"type": user_type, "role": user_role},
                },
            }
        )

    except PmForms.DoesNotExist:
        return Response(
            {"status": "error", "message": "Form not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_endtime(request, formcode):
    try:
        form = SubmitForm.objects.get(formcode=formcode)
        user = request.user

        # Check if user has permission to update end time
        if not (user.user_type == "production" and user.role == "operator"):
            return Response(
                {
                    "status": "error",
                    "message": "You do not have permission to update end time",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Check if form status is management_approved
        if form.status != "technician_submitted":
            return Response(
                {
                    "status": "error",
                    "message": "Form status must be management_approved to update end time",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get end time from request
        endtime = request.data.get("endtime")
        if not endtime:
            return Response(
                {"status": "error", "message": "End time is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update form end time
        form.endtime = endtime
        form.save()

        return Response(
            {
                "status": "success",
                "data": {
                    "message": "End time updated successfully",
                    "form": SubmitFormSerializer(form).data,
                },
            }
        )

    except SubmitForm.DoesNotExist:
        return Response(
            {"status": "error", "message": "Form not found"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_unread_forms_count(request):
    """
    Get count of incomplete forms based on user role and workflow status.
    For PM: Forms that haven't been completed yet
    For Production Management: Forms pending their review
    For Technicians: Forms pending their review
    For Production Operators: Forms pending their action
    """
    try:
        user = request.user
        user_type = user.user_type
        user_role = user.role
        count = 0  # Initialize count

        # Handle sections whether they're a string or list
        if isinstance(user.sections, str):
            user_sections = user.sections.split(",")
        elif isinstance(user.sections, list):
            user_sections = user.sections
        else:
            user_sections = []

        # Get all incomplete forms
        forms = SubmitForm.objects.exclude(Q(status="completed") | Q(status="rejected"))
        pm_forms = PmForms.objects.exclude(
            Q(pmstatus="completed") | Q(pmstatus="rejected")
        )
        # Filter by user's sections unless they have access to all sections
        if user_sections and "all" not in user_sections:
            forms = forms.filter(section__in=user_sections)
            pm_forms = pm_forms.filter(pmsection__in=user_sections)

        # Filter forms based on user role and type
        if user_type == "pm":
            if user_role == "management":
                # PM management sees all incomplete forms
                count = forms.count() + pm_forms.count()
            else:
                # Regular PM users see forms pending their review
                regular_forms = forms.filter(
                    Q(status="pending_pm")
                    | Q(status="production_confirmed")
                    | Q(status="pending_technician")
                    | Q(status="technician_submitted")
                    | Q(status="pending_management")
                    | Q(status="management_approved")
                    | Q(status="pending_production")
                    | Q(status="production_management_confirm")
                    | Q(status="pm_technician_pending")
                    | Q(status="pending_pm")
                )
                pm_specific_forms = pm_forms.filter(
                    Q(pmstatus="pending_pm")
                    | Q(pmstatus="production_confirmed")
                    | Q(pmstatus="management_approved")
                    | Q(pmstatus="pending_pm_technician")
                    | Q(pmstatus="pending_pm_management")
                    | Q(pmstatus="pending_worktype_technician")
                    | Q(pmstatus="worktype_technician_submitted")
                    | Q(pmstatus="pending_worktype_management")
                    | Q(pmstatus="worktype_management_approved")
                    | Q(pmstatus="pending_production_operator")
                    | Q(pmstatus="production_operator_confirmed")
                    | Q(pmstatus="pending_production_management")
                    | Q(pmstatus="production_management_confirmed")
                    | Q(pmstatus="pending_final_pm_technician")
                    | Q(pmstatus="pending_final_pm_management")
                )
                count = regular_forms.count() + pm_specific_forms.count()
        elif user_type == "production":
            if user_role == "management":
                # Production management sees forms pending their review
                prod_forms = forms.filter(
                    Q(status="pending_pm")
                    | Q(status="production_confirmed")
                    | Q(status="pending_technician")
                    | Q(status="technician_submitted")
                    | Q(status="pending_management")
                    | Q(status="management_approved")
                    | Q(status="pending_production")
                    | Q(status="production_management_confirm")
                    | Q(status="pm_technician_pending")
                    | Q(status="pending_pm")
                )
                pm_prod_forms = pm_forms.filter(
                    Q(pmstatus="production_management_confirmed")
                    | Q(pmstatus="production_confirmed")
                    | Q(pmstatus="management_approved")
                    | Q(pmstatus="pending_pm_technician")
                    | Q(pmstatus="pending_pm_management")
                    | Q(pmstatus="pending_worktype_technician")
                    | Q(pmstatus="worktype_technician_submitted")
                    | Q(pmstatus="pending_worktype_management")
                    | Q(pmstatus="worktype_management_approved")
                    | Q(pmstatus="pending_production_operator")
                    | Q(pmstatus="production_operator_confirmed")
                    | Q(pmstatus="pending_production_management")
                    | Q(pmstatus="production_management_confirmed")
                    | Q(pmstatus="pending_final_pm_technician")
                    | Q(pmstatus="pending_final_pm_management")
                )
                count = prod_forms.count() + pm_prod_forms.count()
            elif user_role == "operator":
                # Production operators see forms pending their action
                op_forms = forms.filter(
                    Q(status="pending_pm")
                    | Q(status="production_confirmed")
                    | Q(status="pending_technician")
                    | Q(status="technician_submitted")
                    | Q(status="pending_management")
                    | Q(status="management_approved")
                    | Q(status="pending_production")
                    | Q(status="production_management_confirm")
                    | Q(status="pm_technician_pending")
                    | Q(status="pending_pm")
                )
                pm_op_forms = pm_forms.filter(
                    Q(pmstatus="production_confirmed")
                    | Q(pmstatus="management_approved")
                    | Q(pmstatus="pending_pm_technician")
                    | Q(pmstatus="pending_pm_management")
                    | Q(pmstatus="pending_worktype_technician")
                    | Q(pmstatus="worktype_technician_submitted")
                    | Q(pmstatus="pending_worktype_management")
                    | Q(pmstatus="worktype_management_approved")
                    | Q(pmstatus="pending_production_operator")
                    | Q(pmstatus="production_operator_confirmed")
                    | Q(pmstatus="pending_production_management")
                    | Q(pmstatus="production_management_confirmed")
                    | Q(pmstatus="pending_final_pm_technician")
                    | Q(pmstatus="pending_final_pm_management")
                )
                count = op_forms.count() + pm_op_forms.count()
        elif user_type in [
            "mechanic",
            "electric",
            "utility",
            "generalmechanic",
            "metalworking",
            "tarashkari",
            "paint",
        ]:
            if user_role == "management":
                # Department management sees forms pending their review
                dept_forms = forms.filter(
                    Q(worktype=user_type)
                    & (
                        Q(status="pending_pm")
                        | Q(status="production_confirmed")
                        | Q(status="pending_technician")
                        | Q(status="technician_submitted")
                        | Q(status="pending_management")
                        | Q(status="management_approved")
                        | Q(status="pending_production")
                        | Q(status="production_management_confirm")
                        | Q(status="pm_technician_pending")
                        | Q(status="pending_pm")
                    )
                )
                pm_dept_forms = pm_forms.filter(
                    Q(pmworktype=user_type)
                    & (
                        Q(pmstatus="production_confirmed")
                        | Q(pmstatus="management_approved")
                        | Q(pmstatus="pending_pm_technician")
                        | Q(pmstatus="pending_pm_management")
                        | Q(pmstatus="pending_worktype_technician")
                        | Q(pmstatus="worktype_technician_submitted")
                        | Q(pmstatus="pending_worktype_management")
                        | Q(pmstatus="worktype_management_approved")
                        | Q(pmstatus="pending_production_operator")
                        | Q(pmstatus="production_operator_confirmed")
                        | Q(pmstatus="pending_production_management")
                        | Q(pmstatus="production_management_confirmed")
                        | Q(pmstatus="pending_final_pm_technician")
                        | Q(pmstatus="pending_final_pm_management")
                    )
                )
                count = dept_forms.count() + pm_dept_forms.count()
            else:
                # Technicians see forms pending their review
                tech_forms = forms.filter(
                    Q(status="pending_technician") & Q(worktype=user_type)
                )
                pm_tech_forms = pm_forms.filter(
                    Q(pmstatus="pending_technician") & Q(pmworktype=user_type)
                )
                count = tech_forms.count() + pm_tech_forms.count()

        return Response({"count": count})
    except Exception as e:
        logger.error(f"Error in get_unread_forms_count: {str(e)}")
        return Response(
            {"error": "An error occurred while getting unread forms count"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def test_websocket(request):
    """
    Serve a simple HTML page to test WebSocket connections
    """
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>WebSocket Test</title>
    </head>
    <body>
        <h1>WebSocket Test</h1>
        <div id="messages"></div>

        <script>
            const messagesDiv = document.getElementById('messages');
            
            // Connect to the test WebSocket
            const ws = new WebSocket('ws://127.0.0.1:3001/ws/test/');
            
            ws.onopen = function() {
                appendMessage('Connected to WebSocket');
            };
            
            ws.onmessage = function(event) {
                appendMessage('Received: ' + event.data);
            };
            
            ws.onerror = function(error) {
                appendMessage('Error: ' + error);
            };
            
            ws.onclose = function() {
                appendMessage('Disconnected from WebSocket');
            };
            
            function appendMessage(message) {
                const messageElement = document.createElement('div');
                messageElement.textContent = message;
                messagesDiv.appendChild(messageElement);
            }
        </script>
    </body>
    </html>
    """
    return HttpResponse(html, content_type="text/html")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_user_additional_roles(request):
    try:
        username = request.data.get("username")
        additional_roles = request.data.get("additional_roles", [])

        if not username:
            return Response(
                {"status": "error", "message": "Username is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find the user
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"status": "error", "message": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Update additional roles
        user.additional_roles = additional_roles
        user.save()

        return Response(
            {
                "status": "success",
                "message": "Additional roles updated successfully",
                "additional_roles": additional_roles,
            }
        )

    except Exception as e:
        logger.error(f"Update additional roles error: {str(e)}")
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class PmFormsListView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        try:
            # Get user info from request
            user_type = request.headers.get("X-User-Type", "")
            user_role = request.headers.get("X-User-Role", "")
            user_sections = request.headers.get("X-User-Section", "").split(",")

            # Get all PM forms
            forms = PmForms.objects.all().order_by("-pmformdate")

            # Filter based on user type and role
            if user_type == "pm" and user_role == "management":
                # PM management can see all forms
                pass
            elif user_type == "pm" and user_role != "management":
                # PM technicians can only see forms in their sections
                if "all" not in user_sections:
                    forms = forms.filter(pmsection__in=user_sections)
            else:
                # Other users can only see forms in their sections
                if "all" not in user_sections:
                    forms = forms.filter(pmsection__in=user_sections)

            serializer = PmFormsSerializer(forms, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_pm_form_status(request, pmformcode):
    try:
        form = PmForms.objects.get(pmformcode=pmformcode)
        user = request.user
        action = request.data.get("action", "")

        # Debug logging
        print(f"PM Form Status Update Request: {pmformcode}, Action: {action}")
        print(
            f"Current user: {user.username}, type: {user.user_type}, role: {user.role}"
        )
        print(f"Current form status: {form.pmstatus}")

        # Determine next status based on action and current user
        next_status = None
        now = timezone.now()

        # Map frontend actions to backend statuses
        if (
            action == "pm_technician_submit"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            next_status = "pending_pm_management"
            form.pm_technician_confirmation_date = now
            form.pm_technician_confirmation_name = user.get_full_name() or user.username

        elif (
            action == "pm_management_first_approve"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            next_status = "pending_worktype_technician"
            form.pm_management_confirmation_date = now
            form.pm_management_confirmation_name = user.get_full_name() or user.username

        elif (
            action == "worktype_technician_submit"
            and user.user_type == form.pmworktype
            and user.role == "technician"
        ):
            next_status = "worktype_technician_submitted"
            form.worktype_technician_confirmation_date = now
            form.worktype_technician_confirmation_name = (
                user.get_full_name() or user.username
            )

        elif (
            action == "production_operator_confirmed"
            and user.user_type == "production"
            and user.role == "operator"
        ):
            next_status = "pending_worktype_management"
            form.production_operator_confirmation_date = now
            form.production_operator_confirmation_name = (
                user.get_full_name() or user.username
            )

        elif (
            action == "worktype_management_approve"
            and user.user_type == form.pmworktype
            and user.role == "management"
        ):
            next_status = "worktype_management_approved"
            form.worktype_management_confirmation_date = now
            form.worktype_management_confirmation_name = (
                user.get_full_name() or user.username
            )

        elif (
            action == "production_management_confirm"
            and user.user_type == "production"
            and user.role == "management"
        ):
            next_status = "production_management_confirmed"
            form.production_management_confirmation_date = now
            form.production_management_confirmation_name = (
                user.get_full_name() or user.username
            )

        elif (
            action == "pm_technician_final_submit"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            next_status = "pending_final_pm_management"
            form.final_pm_technician_confirmation_date = now
            form.final_pm_technician_confirmation_name = (
                user.get_full_name() or user.username
            )

        elif (
            action == "pm_management_final_approve"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            next_status = "completed"
            form.final_pm_management_confirmation_date = now
            form.final_pm_management_confirmation_name = (
                user.get_full_name() or user.username
            )

        # If no specific action mapping, use the model's get_next_status method
        if not next_status:
            next_status = form.get_next_status(user)

        # If status doesn't change, user doesn't have permission
        if next_status == form.pmstatus:
            print(f"Status unchanged: {form.pmstatus} -> {next_status}")
            return Response(
                {"status": "error", "message": "عملیات معتبر نیست یا دسترسی ندارید"},
                status=400,
            )

        # Update the status
        print(f"Updating status: {form.pmstatus} -> {next_status}")
        form.pmstatus = next_status

        # Update assignee based on new status
        if next_status == "pending_pm_management":
            # Find a PM management user to assign
            pm_managers = LoginUser.objects.filter(
                user_type="pm", role="management"
            ).first()
            if pm_managers:
                form.current_assignee = pm_managers
        elif next_status == "pending_worktype_technician":
            # Find a worktype technician to assign
            worktype_technicians = LoginUser.objects.filter(
                user_type=form.pmworktype, role="technician"
            ).first()
            if worktype_technicians:
                form.current_assignee = worktype_technicians
        elif next_status == "pending_worktype_management":
            # Find a worktype management user to assign
            worktype_managers = LoginUser.objects.filter(
                user_type=form.pmworktype, role="management"
            ).first()
            if worktype_managers:
                form.current_assignee = worktype_managers
        elif next_status == "pending_production_operator":
            # Find a production operator to assign
            production_operators = LoginUser.objects.filter(
                user_type="production", role="operator"
            ).first()
            if production_operators:
                form.current_assignee = production_operators

        form.updated_at = now
        form.save()

        return Response(
            {
                "status": "success",
                "message": "Form status updated successfully",
                "form": {"pmstatus": next_status, "pmformcode": form.pmformcode},
            }
        )

    except PmForms.DoesNotExist:
        return Response({"status": "error", "message": "Form not found"}, status=404)
    except Exception as e:
        print(f"Error updating PM form status: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def discard_pm_form_status(request, pmformcode):
    try:
        form = PmForms.objects.get(pmformcode=pmformcode)
        user = request.user

        # Debug logging
        print(f"PM Form Discard Request: {pmformcode}")
        print(
            f"Current user: {user.username}, type: {user.user_type}, role: {user.role}"
        )
        print(f"Current form status: {form.pmstatus}")

        # Determine previous status based on current status
        previous_status = None
        now = timezone.now()

        # Map current status to previous status in the workflow
        if (
            form.pmstatus == "pending_pm_management"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            previous_status = "pending_pm_technician"
            form.pm_technician_confirmation_date = None

        elif (
            form.pmstatus == "worktype_technician_submitted"
            and user.user_type == "production"
            and user.role == "operator"
        ):
            previous_status = "pending_worktype_technician"
            form.pm_management_confirmation_date = None

        elif (
            form.pmstatus == "pending_worktype_technician"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            previous_status = "pending_pm_technician"
            form.pm_management_confirmation_date = None

        elif (
            form.pmstatus == "pending_production_operator"
            and user.user_type == form.pmworktype
            and user.role == "technician"
        ):
            previous_status = "pending_worktype_technician"
            form.worktype_technician_confirmation_date = None
            # Clear worktype technician data to allow re-editing
            PmAghlam.objects.filter(pmformcode=pmformcode).delete()

        elif (
            form.pmstatus == "pending_worktype_management"
            and user.user_type == form.pmworktype
            and user.role == "management"
        ):
            previous_status = "worktype_technician_submitted"
            form.production_operator_confirmation_date = None

        elif (
            form.pmstatus == "worktype_management_approved"
            and user.user_type == "production"
            and user.role == "management"
        ):
            previous_status = "pending_worktype_management"
            form.production_management_confirmation_date = None

        elif (
            form.pmstatus == "production_management_confirmed"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            previous_status = "worktype_management_approved"
            form.final_pm_technician_confirmation_date = None

        elif (
            form.pmstatus == "completed"
            and user.user_type == "pm"
            and user.role == "management"
        ):
            previous_status = "pending_final_pm_management"
            form.final_pm_management_confirmation_date = None

        # If no specific mapping, keep current status
        if not previous_status:
            print(f"No previous status found for {form.pmstatus}")
            return Response(
                {"status": "error", "message": "عملیات معتبر نیست یا دسترسی ندارید"},
                status=400,
            )

        # Update the status
        print(f"Discarding status: {form.pmstatus} -> {previous_status}")
        form.pmstatus = previous_status

        # Update assignee based on new status
        if previous_status == "pending_pm_technician":
            # Find a PM technician to assign
            pm_technicians = LoginUser.objects.filter(
                user_type="pm", role="technician"
            ).first()
            if pm_technicians:
                form.current_assignee = pm_technicians
        elif previous_status == "pending_pm_management":
            # Find a PM management user to assign
            pm_managers = LoginUser.objects.filter(
                user_type="pm", role="management"
            ).first()
            if pm_managers:
                form.current_assignee = pm_managers
        elif previous_status == "pending_worktype_technician":
            # Find a worktype technician to assign
            worktype_technicians = LoginUser.objects.filter(
                user_type=form.pmworktype, role="technician"
            ).first()
            if worktype_technicians:
                form.current_assignee = worktype_technicians
        elif previous_status == "pending_production_operator":
            # Find a production operator to assign
            production_operators = LoginUser.objects.filter(
                user_type="production", role="operator"
            ).first()
            if production_operators:
                form.current_assignee = production_operators

        form.updated_at = now
        form.save()

        return Response(
            {
                "status": "success",
                "message": "فرم به مرحله قبل بازگشت و آماده ویرایش است",
                "form": {"pmstatus": previous_status, "pmformcode": form.pmformcode},
            }
        )

    except PmForms.DoesNotExist:
        return Response({"status": "error", "message": "Form not found"}, status=404)
    except Exception as e:
        print(f"Error discarding PM form status: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=500)


# Edit Pm Forms In Database when discard
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@api_view(["POST"])
@permission_classes([AllowAny])
def edit_pm_form(request, pmformcode):
    try:
        # Get the PM form
        pm_form = get_object_or_404(PmForms, pmformcode=pmformcode)
        user = request.user

        # Debug logging
        print(f"PM Form Discard Request: {pmformcode}")
        print(
            f"Current user: {user.username}, type: {user.user_type}, role: {user.role}"
        )
        print(f"Current form status: {pm_form.pmstatus}")

        # Get the technician submission
        technician_submission = PmTechnician.objects.filter(
            pmformcode=pmformcode
        ).first()

        if not technician_submission:
            return Response(
                {"status": "error", "message": "No technician submission found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Update technician submission with new data
        new_data = request.data

        # Update fields
        technician_submission.pmfailurereason = new_data.get(
            "pmfailurereason", technician_submission.pmfailurereason
        )
        technician_submission.pmworktype = new_data.get(
            "pmworktype", technician_submission.pmworktype
        )
        technician_submission.pmproblemdescription = new_data.get(
            "pmproblemdescription", technician_submission.pmproblemdescription
        )
        technician_submission.worktime = new_data.get(
            "worktime", technician_submission.worktime
        )
        technician_submission.notdonereason = new_data.get(
            "notdonereason", technician_submission.notdonereason
        )
        technician_submission.pmjobstatus = new_data.get(
            "pmjobstatus", technician_submission.pmjobstatus
        )

        # Parse and update datetime fields if provided
        if "startpmrepairtime" in new_data:
            try:
                startpmrepairtime = datetime.datetime.fromisoformat(
                    new_data["startpmrepairtime"].replace("Z", "+00:00")
                )
                technician_submission.startpmrepairtime = startpmrepairtime
            except (ValueError, TypeError):
                pass

        if "endpmrepairtime" in new_data:
            try:
                endpmrepairtime = datetime.datetime.fromisoformat(
                    new_data["endpmrepairtime"].replace("Z", "+00:00")
                )
                technician_submission.endpmrepairtime = endpmrepairtime
            except (ValueError, TypeError):
                pass

        # Save the updated submission
        technician_submission.save()

        # Update or create PmAghlam records
        if "pmaghlam" in new_data:
            # Delete existing aghlam records for this form
            PmAghlam.objects.filter(pmformcode=pmformcode).delete()

            # Create new aghlam records
            for aghlam_data in new_data["pmaghlam"]:
                PmAghlam.objects.create(
                    pmformcode=pmformcode,
                    kalaname=aghlam_data.get("kalaname", ""),
                    countkala=aghlam_data.get("countkala", ""),
                    vahedkala=aghlam_data.get("vahedkala", 0),
                    codekala=aghlam_data.get("codekala", ""),
                )

        # Update or create PmPersonel records
        if "pmpersonel" in new_data:
            # Delete existing personel records for this form
            PmPersonel.objects.filter(pmformcode=pmformcode).delete()

            # Create new personel records
            for personel_data in new_data["pmpersonel"]:
                PmPersonel.objects.create(
                    pmformcode=pmformcode,
                    personel=personel_data.get("personel", ""),
                    personelnumber=personel_data.get("personelnumber", ""),
                    specialjob=personel_data.get("specialjob", ""),
                    repairstatus=personel_data.get("repairstatus", ""),
                    unitrepair=personel_data.get("unitrepair", ""),
                    shift=personel_data.get("shift", ""),
                )
                # Parse and update datetime fields if provided
                if "starttimerepair" in new_data:
                    try:
                        starttimerepair = datetime.datetime.fromisoformat(
                            new_data["starttimerepair"].replace("Z", "+00:00")
                        )
                        personel_data.starttimerepair = starttimerepair
                    except (ValueError, TypeError):
                        pass
                if "endtimerepair" in new_data:
                    try:
                        endtimerepair = datetime.datetime.fromisoformat(
                            new_data["endtimerepair"].replace("Z", "+00:00")
                        )
                        personel_data.endtimerepair = endtimerepair
                    except (ValueError, TypeError):
                        pass

        return Response(
            {
                "status": "success",
                "message": "Form and related records updated successfully",
            }
        )

    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def discard_form_status(request, formcode):
    try:
        form = SubmitForm.objects.get(formcode=formcode)
        user = request.user

        # Debug logging
        print(f"PM Form Discard Request: {formcode}")
        print(
            f"Current user: {user.username}, type: {user.user_type}, role: {user.role}"
        )
        print(f"Current form status: {form.status}")

        # Determine previous status based on current status
        previous_status = None
        now = timezone.now()

        # Map current status to previous status in the workflow
        if (
            form.status == "technician_submitted"
            and user.user_type == "production"
            and user.role == "operator"
        ):
            previous_status = "pending_technician"
            form.operator_confirmation_date = None

        elif form.status == "production_confirmed" and (
            (user.user_type == form.worktype and user.role == "management")
            or (user.user_type == "generalmechanic" and user.role == "management")
        ):
            previous_status = "technician_submitted"
            form.management_confirmation_date = None

        elif (
            form.status == "management_approved"
            and user.user_type == "production"
            and user.role == "management"
        ):
            previous_status = "production_confirmed"
            form.pm_management_confirmation_date = None

        elif (
            form.status == "production_management_confirm"
            and user.user_type == "pm"
            and user.role == "technician"
        ):
            previous_status = "management_approved"
            form.worktype_technician_confirmation_date = None

        elif form.status == "pending_worktype_management" and (
            (user.user_type == form.pmworktype and user.role == "management")
            or (user.user_type == "generalmechanic" and user.role == "management")
        ):
            previous_status = "worktype_technician_submitted"
            form.production_management_confirmation_date = None

        # If no specific mapping, keep current status
        if not previous_status:
            print(f"No previous status found for {form.status}")
            return Response(
                {"status": "error", "message": "عملیات معتبر نیست یا دسترسی ندارید"},
                status=400,
            )

        # Update the status
        print(f"Discarding status: {form.status} -> {previous_status}")
        form.status = previous_status

        # Update assignee based on new status
        if previous_status == "pending_pm_technician":
            # Find a PM technician to assign
            pm_technicians = LoginUser.objects.filter(
                user_type="pm", role="technician"
            ).first()
            if pm_technicians:
                form.current_assignee = pm_technicians
        elif previous_status == "pending_pm_management":
            # Find a PM management user to assign
            pm_managers = LoginUser.objects.filter(
                user_type="pm", role="management"
            ).first()
            if pm_managers:
                form.current_assignee = pm_managers
        elif previous_status == "pending_worktype_technician":
            # Find a worktype technician to assign
            worktype_technicians = LoginUser.objects.filter(
                user_type=form.pmworktype, role="technician"
            ).first()
            if worktype_technicians:
                form.current_assignee = worktype_technicians
        elif previous_status == "pending_production_operator":
            # Find a production operator to assign
            production_operators = LoginUser.objects.filter(
                user_type="production", role="operator"
            ).first()
            if production_operators:
                form.current_assignee = production_operators

        form.updated_at = now
        form.save()

        return Response(
            {
                "status": "success",
                "message": "فرم به مرحله قبل بازگشت و آماده ویرایش است",
                "form": {"status": previous_status, "formcode": form.formcode},
            }
        )

    except PmForms.DoesNotExist:
        return Response({"status": "error", "message": "Form not found"}, status=404)
    except Exception as e:
        print(f"Error discarding PM form status: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=500)


def can_edit_form(user, form):
    """
    Check if user has permission to edit the form based on form status and user role
    """
    if (
        user.user_type == "pm"
        and user.role == "technician"
        and form.pmstatus == "pending_pm_technician"
    ):
        return True
    elif (
        user.user_type == form.pmworktype
        and user.role == "technician"
        and form.pmstatus == "pending_worktype_technician"
    ):
        return True
    elif (
        user.user_type == "production"
        and user.role == "operator"
        and form.pmstatus == "pending_production_operator"
    ):
        return True
    return False


class PmFormDetail(generics.RetrieveAPIView):
    """
    Retrieve a PM form instance by pmformcode
    """

    queryset = PmForms.objects.all()
    serializer_class = PmFormsSerializer
    lookup_field = "pmformcode"
    permission_classes = [AllowAny]


class ReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing calendar reminders
    """

    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return reminders for the current user"""
        return Reminder.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def due_reminders(self, request):
        """Get reminders that are due but not sent"""
        due_reminders = self.get_queryset().filter(
            datetime__lte=timezone.now(), is_sent=False
        )
        serializer = self.get_serializer(due_reminders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def mark_sent(self, request, pk=None):
        """Mark a reminder as sent"""
        reminder = self.get_object()
        reminder.is_sent = True
        reminder.save()
        return Response({"status": "reminder marked as sent"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_reminder_sms(request):
    """
    Send SMS for due reminders
    """
    try:
        reminder_id = request.data.get("reminder_id")
        to = request.data.get("to")  # Get the specific phone number to send to

        if not reminder_id or not to:
            return Response(
                {"status": "error", "message": "Both reminder_id and to are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reminder = get_object_or_404(Reminder, id=reminder_id, created_by=request.user)

        # Convert datetime to Persian format
        persian_datetime = jdatetime.datetime.fromgregorian(datetime=reminder.datetime)
        formatted_datetime = persian_datetime.strftime("%Y/%m/%d %H:%M")

        # Create SMS message
        message = f"یادآوری: {reminder.name}\nزمان: {formatted_datetime}\nنوع کار: {reminder.workType}"
        if reminder.description:
            message += f"\nتوضیحات: {reminder.description}"

        # Send SMS using the existing SMS API
        params = {
            "service": "SendArray",
            "username": SMS_USERNAME,
            "password": SMS_PASSWORD,
            "to": to,
            "message": message,
            "from": SMS_FROM,
            "flash": "false",
        }

        response = requests.get(SMS_API_URL, params=params)

        if response.status_code == 200:
            # Only mark as sent if this was the last phone number
            if to in reminder.phoneNumbers:
                reminder.phoneNumbers.remove(to)
                if not reminder.phoneNumbers:  # If no more phone numbers left
                    reminder.is_sent = True
                reminder.save()

            return Response(
                {"status": "success", "message": "Reminder SMS sent successfully"}
            )
        else:
            return Response(
                {"status": "error", "message": "Failed to send SMS"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

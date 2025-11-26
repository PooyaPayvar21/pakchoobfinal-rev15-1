import datetime
import jdatetime
from django.utils import timezone


def generate_formcode(phase, section_code, problemdate):
    """
    Generates a unique formcode based on the phase, section code, and problem date.
    Args:
    - phase (str): The phase of the form (e.g., "01", "02", etc.).
    - section_code (str): The section code (e.g., "01", "02").
    - problemdate (datetime): The problem date for the form, used for generating a unique part of the form code.
    Returns:
    - str: The generated formcode base (without sequence number).
    """
    # Convert the problemdate to Persian (Jalali) date to extract the Jalali month
    if problemdate:
        jalali_date = jdatetime.date.fromgregorian(date=problemdate.date())
        persian_month = jalali_date.month  # Get month number in Persian calendar
    else:
        # Handle the case where problemdate is None
        jalali_now = jdatetime.datetime.now()
        persian_month = jalali_now.month

    # Format the Persian month with zero-padding (e.g., "01")
    month_str = str(persian_month).zfill(2)

    # Combine phase, section_code, and the Persian month number into the formcode
    formcode = f"{phase}{section_code}{month_str}"

    return formcode

def generate_pm_formcode(phase, section_code, pmformdate):
    """
    Generates a unique formcode based on the phase, section code, and problem date.
    Args:
    - phase (str): The phase of the form (e.g., "01", "02", etc.).
    - section_code (str): The section code (e.g., "01", "02").
    - pmformdate (datetime): The problem date for the form, used for generating a unique part of the form code.
    Returns:
    - str: The generated formcode base (without sequence number).
    """
    # Convert the pmformdate to Persian (Jalali) date to extract the Jalali month
    if pmformdate:
        jalali_date = jdatetime.date.fromgregorian(date=pmformdate.date())
        persian_month = jalali_date.month  # Get month number in Persian calendar
    else:
        # Handle the case where pmformdate is None
        jalali_now = jdatetime.datetime.now()
        persian_month = jalali_now.month

    # Format the Persian month with zero-padding (e.g., "01")
    month_str = str(persian_month).zfill(2)

    # Combine phase, section_code, and the Persian month number into the formcode
    formcode = f"PM{phase}{section_code}{month_str}"

    return formcode
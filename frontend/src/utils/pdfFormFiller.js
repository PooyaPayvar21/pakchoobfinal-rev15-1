import { PDFDocument } from "pdf-lib";

export const fillPdfForm = async (pdfBytes, formData, section = "all") => {
  try {
    // Validate input
    if (!pdfBytes || pdfBytes.byteLength === 0) {
      throw new Error("Invalid PDF data: PDF bytes are empty or null");
    }

    // Load the PDF document with validation
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch (loadError) {
      console.error("Error loading PDF:", loadError);
      throw new Error(
        "Failed to load PDF document. The file may be corrupted or not a valid PDF."
      );
    }

    // Get the form
    const form = pdfDoc.getForm();

    // Map of field names to their values - matching the actual form fields
    const fieldMapping = {
      // درخواست دهنده (SubmitForm.jsx) fields
      requester_name: formData.operatorname || "", // نام اپراتور
      requester_department: formData.section || "", // بخش
      requester_position: formData.shift || "", // شیفت
      requester_date: formData.problemdate || "", // تاریخ مشکل
      requester_machine: formData.machinename || "", // نام ماشین
      requester_machine_code: formData.machinecode || "", // کد ماشین
      requester_phase: formData.phase || "", // فاز
      requester_place: formData.machineplacecode || "", // کد محل ماشین
      requester_worktype: formData.worktype || "", // نوع کار
      requester_stoptime: formData.stoptime || "", // زمان توقف
      requester_failuretime: formData.failuretime || "", // زمان خرابی
      requester_productionstop: formData.productionstop || "", // توقف تولید
      requester_suggesttime: formData.suggesttime || "", // زمان پیشنهادی
      requester_worksuggest: formData.worksuggest || "", // پیشنهاد کار
      requester_fixrepair: formData.fixrepair || "", // تعمیر ثابت
      requester_reportinspection: formData.reportinspection || "", // گزارش بازرسی
      requester_faultdm: formData.faultdm || "", // خطای DM
      requester_problemdescription: formData.problemdescription || "", // توضیحات مشکل

      // سرپرست/مسئول تعمیرات (TechnicianSubmit.jsx) fields
      technician_failurepart: formData.failurepart || "", // نام قسمت معیوب
      technician_failuretime: formData.failuretime || "", // مدت زمان تشخیص عیب
      technician_sparetime: formData.sparetime || "",
      technician_startfailuretime: formData.startfailuretime || "", // میزان ساعت کار تجهیز
      technician_problemdescription: formData.problemdescription || "", // کلیات شرح عیب
      technician_jobstatus: formData.jobstatus || "", // وضعیت کار

      // Aghlams (قطعات) fields
      aghlam_kalaname: formData.kalaname || "", // نام کالا
      aghlam_countkala: formData.countkala || "", // تعداد
      aghlam_vahedkala: formData.vahedkala || "", // واحد
      aghlam_codekala: formData.codekala || "", // کد کالا
      aghlam_flamekala: formData.flamekala || "", // قطعه مستعمل
      aghlam_shopkala: formData.shopkala || "", // خرید فوری

      // Personel (پرسنل) fields
      personel_name: formData.personel || "", // پرسنل انجام دهنده
      personel_number: formData.personelnumber || "", // شماره پرسنلی
      personel_datesubmit: formData.datesubmit || "", // تاریخ انجام
      personel_specialjob: formData.specialjob || "", // مهارت
      personel_starttimerepair: formData.starttimerepair || "", // ساعت شروع تعمیرات
      personel_endtimerepair: formData.endtimerepair || "", // ساعت پایان تعمیرات
      personel_repairstatus: formData.repairstatus || "", // وضعیت تعمیر
      personel_unitrepair: formData.unitrepair || "", // واحد انجام دهنده
      personel_shift: formData.shift || "", // شیفت
      personel_delayreason: formData.delayreason || "", // دلیل تاخیر
      personel_failurereason: formData.failurereason || "", // دلیل خرابی
      personel_failurereasondescription:
        formData.failurereasondescription || "", // شرح دلیل خرابی
      personel_suggestionfailure: formData.suggestionfailure || "", // پیشنهاد
    };

    // Filter fields based on section
    const sectionPrefixes = {
      requester: "requester_",
      technician: "technician_",
      aghlam: "aghlam_",
      personel: "personel_",
      all: "", // No prefix filter for 'all'
    };

    const prefix = sectionPrefixes[section] || "";

    // Fill each field
    const fields = form.getFields();
    fields.forEach((field) => {
      const fieldName = field.getName();
      if (
        fieldMapping[fieldName] &&
        (section === "all" || fieldName.startsWith(prefix))
      ) {
        const textField = form.getTextField(fieldName);
        if (textField) {
          textField.setText(fieldMapping[fieldName]);
        }
      }
    });

    // Save the PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error("Error filling PDF form:", error);
    throw error;
  }
};

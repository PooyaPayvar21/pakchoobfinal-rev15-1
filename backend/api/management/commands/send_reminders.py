from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Reminder
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Sends SMS reminders for due reminders"

    def handle(self, *args, **options):
        # Get all due reminders that haven't been sent
        due_reminders = Reminder.objects.filter(
            datetime__lte=timezone.now(), is_sent=False
        )

        for reminder in due_reminders:
            try:
                # Send SMS to each phone number
                for phone_number in reminder.phoneNumbers:
                    # Construct the message
                    message = (
                        f"Reminder: {reminder.name}\n"
                        f"Date: {reminder.datetime.strftime('%Y-%m-%d %H:%M')}\n"
                        f"Work Type: {reminder.workType}"
                    )
                    if reminder.description:
                        message += f"\nDescription: {reminder.description}"

                    # Send SMS using your SMS service
                    # This is a placeholder - replace with your actual SMS sending logic
                    response = self.send_sms(phone_number, message)

                    if response.get("status") == "success":
                        logger.info(
                            f"Successfully sent SMS to {phone_number} for reminder {reminder.id}"
                        )
                    else:
                        logger.error(
                            f"Failed to send SMS to {phone_number} for reminder {reminder.id}: {response.get('error')}"
                        )

                # Mark reminder as sent
                reminder.is_sent = True
                reminder.save()
                logger.info(f"Marked reminder {reminder.id} as sent")

            except Exception as e:
                logger.error(f"Error processing reminder {reminder.id}: {str(e)}")

    def send_sms(self, phone_number, message):
        """
        Placeholder for SMS sending logic.
        Replace this with your actual SMS service implementation.
        """
        try:
            # Import your SMS service here
            from api.views import send_sms

            # Call your SMS service
            response = send_sms(phone_number, message)
            return response
        except Exception as e:
            logger.error(f"Error sending SMS to {phone_number}: {str(e)}")
            return {"status": "error", "error": str(e)}

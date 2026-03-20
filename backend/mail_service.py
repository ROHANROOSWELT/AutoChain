import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

def send_email(subject, body, to_email=None):
    """
    Sends an actual email using SMTP.
    If credentials are not provided in .env, it logs to console as a fallback.
    """
    load_dotenv() # Reload from disk to pick up recent .env edits
    sender_email = os.getenv("SMTP_EMAIL")
    sender_password = os.getenv("SMTP_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    
    # Use user provided email if available, otherwise fallback to sender
    recipient = to_email or sender_email
    
    if not sender_email or not sender_password:
        print("\n--- 📧 SIMULATED EMAIL ---")
        print(f"To: {recipient}")
        print(f"Subject: {subject}")
        print(f"Body: {body}")
        print("--------------------------\n")
        return False, "SMTP credentials missing in .env"

    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"AutoChain AI <{sender_email}>"
        msg['To'] = recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Connect and send
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        # Cast to string to satisfy type checker (we checked they exist above)
        server.login(str(sender_email), str(sender_password))
        text = msg.as_string()
        server.sendmail(str(sender_email), recipient, text)
        server.quit()
        
        print(f"✅ Real email sent to {recipient}")
        return True, "Email sent successfully"
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False, str(e)

if __name__ == "__main__":
    # Test
    send_email("Test Subject", "This is a test email from AutoChain.")

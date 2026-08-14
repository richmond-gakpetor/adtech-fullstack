"""Email service for sending notifications"""

from typing import Optional
from pathlib import Path
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import resend
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import settings
from app.models.user import User
from app.models.payment import Payment, BillboardListingPayment
from app.models.billboard import Billboard
from app.models.review import Review


# Configure Resend
resend.api_key = settings.RESEND_API_KEY

# Configure Jinja2
TEMPLATES_DIR = Path(__file__).parent / "email_templates"
jinja_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)


class EmailService:
    """Service for sending email notifications"""
    
    @staticmethod
    async def send_email_verification(
        user_email: str,
        user_name: str,
        user_type: str,
        verification_token: str
    ) -> bool:
        """
        Send email verification link
        
        Args:
            user_email: User's email address
            user_name: User's first name
            user_type: User type (owner, advertiser, admin)
            verification_token: Email verification token
            
        Returns:
            True if email sent successfully
        """
        try:
            # Create verification link
            verification_link = f"{settings.EMAIL_VERIFICATION_URL}?token={verification_token}"
            
            # Render email template
            template = jinja_env.get_template("email_verification.html")
            html_content = template.render(
                user_name=user_name,
                user_type=user_type,
                verification_link=verification_link,
                expiry_hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
            )
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [user_email],
                "subject": "Verify Your Email - Xposure GH",
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending email verification: {str(e)}")
            return False
    
    @staticmethod
    async def send_kyc_status_email(
        user_email: str,
        user_name: str,
        approved: bool,
        rejection_reason: Optional[str] = None
    ) -> bool:
        """
        Send KYC approval/rejection notification
        
        Args:
            user_email: User's email address
            user_name: User's first name
            approved: Whether KYC was approved
            rejection_reason: Reason for rejection (if rejected)
            
        Returns:
            True if email sent successfully
        """
        try:
            # Render email template
            template = jinja_env.get_template("kyc_status.html")
            html_content = template.render(
                user_name=user_name,
                approved=approved,
                rejection_reason=rejection_reason,
                dashboard_url=f"{settings.FRONTEND_URL}/owner-dashboard",
                kyc_url=f"{settings.FRONTEND_URL}/owner-dashboard?action=kyc",
                support_email=settings.FROM_EMAIL
            )
            
            # Send email via Resend
            subject = "KYC Verification Approved - Xposure GH" if approved else "KYC Verification - Action Required"
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [user_email],
                "subject": subject,
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending KYC status email: {str(e)}")
            return False
    
    @staticmethod
    async def send_payment_success_email(
        db: AsyncSession,
        user_id: uuid.UUID,
        payment_id: uuid.UUID
    ) -> bool:
        """
        Send email notification for successful payment
        
        Args:
            db: Database session
            user_id: User ID
            payment_id: Payment ID
            
        Returns:
            True if email sent successfully
        """
        try:
            # Get user
            user_stmt = select(User).where(User.id == user_id)
            user_result = await db.execute(user_stmt)
            user = user_result.scalar_one_or_none()
            
            if not user:
                return False
            
            # Get payment
            payment_stmt = select(Payment).where(Payment.id == payment_id)
            payment_result = await db.execute(payment_stmt)
            payment = payment_result.scalar_one_or_none()
            
            if not payment:
                return False
            
            # Get listing payment details
            listing_stmt = select(BillboardListingPayment).where(
                BillboardListingPayment.payment_id == payment_id
            )
            listing_result = await db.execute(listing_stmt)
            listing_payment = listing_result.scalar_one_or_none()
            
            if not listing_payment:
                return False
            
            # Get billboard
            billboard_stmt = select(Billboard).where(
                Billboard.id == listing_payment.billboard_id
            )
            billboard_result = await db.execute(billboard_stmt)
            billboard = billboard_result.scalar_one_or_none()
            
            if not billboard:
                return False
            
            # Format dates
            access_expires = listing_payment.access_expires_at.strftime("%B %d, %Y") if listing_payment.access_expires_at else "N/A"
            grace_expires = listing_payment.grace_period_ends_at.strftime("%B %d, %Y") if listing_payment.grace_period_ends_at else None
            
            # Render email template
            template = jinja_env.get_template("payment_success.html")
            html_content = template.render(
                user_name=user.first_name,
                billboard_title=billboard.title,
                billboard_location=billboard.location,
                duration_days=listing_payment.duration_days,
                amount_ghs=f"{payment.amount_ghs:.2f}",
                payment_reference=payment.reference,
                access_expires=access_expires,
                grace_expires=grace_expires,
                dashboard_url=f"{settings.FRONTEND_URL}/owner-dashboard",
                support_email=settings.FROM_EMAIL
            )
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [user.email],
                "subject": f"Payment Successful - {billboard.title} Listing is Live!",
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            # Log error but don't fail the payment process
            print(f"Error sending payment success email: {str(e)}")
            return False
    
    @staticmethod
    async def send_password_reset_email(
        user_email: str,
        user_name: str,
        reset_token: str
    ) -> bool:
        """
        Send password reset email
        
        Args:
            user_email: User's email address
            user_name: User's first name
            reset_token: Password reset token
            
        Returns:
            True if email sent successfully
        """
        try:
            # Create reset link
            reset_link = f"{settings.PASSWORD_RESET_URL}?token={reset_token}"
            
            # Render email template
            template = jinja_env.get_template("password_reset.html")
            html_content = template.render(
                user_name=user_name,
                reset_link=reset_link
            )
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [user_email],
                "subject": "Reset Your Password - Xposure GH",
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending password reset email: {str(e)}")
            return False
    
    @staticmethod
    async def send_new_thread_email(
        owner_email: str,
        owner_name: str,
        advertiser_name: str,
        billboard_title: str,
        initial_message: str,
        thread_id: str,
        billboard_id: str
    ) -> bool:
        """
        Send email notification when new chat thread is created
        
        Args:
            owner_email: Billboard owner's email
            owner_name: Owner's first name
            advertiser_name: Advertiser's full name
            billboard_title: Billboard title
            initial_message: First message in thread
            thread_id: Chat thread ID
            billboard_id: Billboard ID
            
        Returns:
            True if email sent successfully
        """
        try:
            # Create thread link
            thread_link = f"{settings.FRONTEND_URL}/billboard/{billboard_id}/chat?thread={thread_id}"
            
            # Truncate message if too long
            message_preview = initial_message[:150] + "..." if len(initial_message) > 150 else initial_message
            
            # Render email template
            template = jinja_env.get_template("new_thread.html")
            html_content = template.render(
                owner_name=owner_name,
                advertiser_name=advertiser_name,
                billboard_title=billboard_title,
                message_preview=message_preview,
                thread_link=thread_link
            )
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [owner_email],
                "subject": f"New Inquiry: {advertiser_name} interested in {billboard_title}",
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending new thread email: {str(e)}")
            return False
    
    @staticmethod
    async def send_listing_expiration_reminder(
        user_email: str,
        user_name: str,
        billboard_title: str,
        billboard_location: str,
        billboard_id: uuid.UUID,
        expires_at: datetime,
        days_remaining: int
    ) -> bool:
        """
        Send listing expiration reminder email
        
        Args:
            user_email: Billboard owner's email
            user_name: Owner's first name
            billboard_title: Billboard title
            billboard_location: Billboard location
            billboard_id: Billboard ID
            expires_at: Expiration date
            days_remaining: Days until expiration
            
        Returns:
            True if email sent successfully
        """
        try:
            # Format expiration date
            expiry_date = expires_at.strftime("%B %d, %Y")
            
            # Create renewal link
            renewal_link = f"{settings.FRONTEND_URL}/owner-dashboard?renew={billboard_id}"
            
            # Render email template
            template = jinja_env.get_template("listing_expiration_reminder.html")
            html_content = template.render(
                user_name=user_name,
                billboard_title=billboard_title,
                billboard_location=billboard_location,
                expiry_date=expiry_date,
                days_remaining=days_remaining,
                renewal_link=renewal_link,
                dashboard_url=f"{settings.FRONTEND_URL}/owner-dashboard",
                support_email=settings.FROM_EMAIL
            )
            
            # Determine subject based on urgency
            if days_remaining == 1:
                subject = f"⚠️ Final Reminder: {billboard_title} Expires Tomorrow!"
            else:
                subject = f"Reminder: {billboard_title} Listing Expires in {days_remaining} Days"
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [user_email],
                "subject": subject,
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending listing expiration reminder: {str(e)}")
            return False
    
    @staticmethod
    async def send_new_message_email(
        recipient_email: str,
        recipient_name: str,
        sender_name: str,
        billboard_title: str,
        message_text: str,
        thread_id: str,
        billboard_id: str
    ) -> bool:
        """
        Send email notification for new chat message
        
        Args:
            recipient_email: Recipient's email
            recipient_name: Recipient's first name
            sender_name: Sender's full name
            billboard_title: Billboard title
            message_text: Message content
            thread_id: Chat thread ID
            billboard_id: Billboard ID
            
        Returns:
            True if email sent successfully
        """
        try:
            # Create thread link
            thread_link = f"{settings.FRONTEND_URL}/billboard/{billboard_id}/chat?thread={thread_id}"
            
            # Truncate message if too long
            message_preview = message_text[:150] + "..." if len(message_text) > 150 else message_text
            
            # Render email template
            template = jinja_env.get_template("new_message.html")
            html_content = template.render(
                recipient_name=recipient_name,
                sender_name=sender_name,
                billboard_title=billboard_title,
                message_preview=message_preview,
                thread_link=thread_link
            )
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [recipient_email],
                "subject": f"New message from {sender_name} - {billboard_title}",
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending new message email: {str(e)}")
            return False
    
    @staticmethod
    async def send_review_notification_email(
        db: AsyncSession,
        review_id: uuid.UUID
    ) -> bool:
        """
        Send email notification when someone receives a review
        
        Args:
            db: Database session
            review_id: Review ID
            
        Returns:
            True if email sent successfully
        """
        try:
            # Get review with relationships
            review_stmt = select(Review).where(Review.id == review_id)
            review_result = await db.execute(review_stmt)
            review = review_result.scalar_one_or_none()
            
            if not review:
                return False
            
            # Get reviewer
            reviewer_stmt = select(User).where(User.id == review.reviewer_id)
            reviewer_result = await db.execute(reviewer_stmt)
            reviewer = reviewer_result.scalar_one_or_none()
            
            if not reviewer:
                return False
            
            # Get reviewee (person being reviewed)
            reviewee = None
            if review.reviewee_id:
                reviewee_stmt = select(User).where(User.id == review.reviewee_id)
                reviewee_result = await db.execute(reviewee_stmt)
                reviewee = reviewee_result.scalar_one_or_none()
            
            # For billboard reviews, get owner from billboard
            billboard = None
            if review.billboard_id:
                billboard_stmt = select(Billboard).where(Billboard.id == review.billboard_id)
                billboard_result = await db.execute(billboard_stmt)
                billboard = billboard_result.scalar_one_or_none()
                
                if billboard and not reviewee:
                    # Get billboard owner as reviewee
                    owner_stmt = select(User).where(User.id == billboard.owner_id)
                    owner_result = await db.execute(owner_stmt)
                    reviewee = owner_result.scalar_one_or_none()
            
            if not reviewee:
                return False
            
            # Determine review type context
            review_subject = ""
            review_context = ""
            
            if review.review_type == "billboard" and billboard:
                review_subject = f"New Review for Your Billboard: {billboard.title}"
                review_context = f"Your billboard <strong>{billboard.title}</strong> in {billboard.location}"
            elif review.review_type == "owner":
                review_subject = "New Review Received as Billboard Owner"
                review_context = "You as a <strong>billboard owner</strong>"
            elif review.review_type == "advertiser":
                review_subject = "New Review Received as Advertiser"
                review_context = "You as an <strong>advertiser</strong>"
            
            # Star rating display
            stars = "★" * review.rating + "☆" * (5 - review.rating)
            
            # Render email template
            template = jinja_env.get_template("review_notification.html")
            html_content = template.render(
                reviewee_name=reviewee.first_name,
                review_context=review_context,
                stars=stars,
                review_title=review.title,
                review_comment=review.comment,
                reviewer_name=f"{reviewer.first_name} {reviewer.last_name}",
                campaign_name=review.campaign_name,
                reviews_url=f"{settings.FRONTEND_URL}/reviews"
            )
            
            # Send email via Resend
            params = {
                "from": f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>",
                "to": [reviewee.email],
                "subject": review_subject,
                "html": html_content
            }
            
            response = resend.Emails.send(params)
            
            return True
            
        except Exception as e:
            print(f"Error sending review notification email: {str(e)}")
            return False


# Global email service instance
email_service = EmailService()

"""Payment API endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.payment import (
    InitializePaymentRequest,
    PaymentInitializeResponse,
    VerifyPaymentRequest,
    PaymentVerifyResponse,
    PaymentHistoryResponse,
    PaystackWebhookEvent
)
from app.schemas.common import APIResponse
from app.services.payment_service import payment_service
from app.core.paystack import paystack_service
from app.core.exceptions import BadRequestException, PaymentException


router = APIRouter()


@router.post("/initialize", response_model=APIResponse[PaymentInitializeResponse])
async def initialize_payment(
    request: InitializePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initialize a billboard listing payment
    
    This endpoint creates a payment record and returns a Paystack authorization URL
    for the user to complete the payment.
    """
    try:
        result = await payment_service.initialize_listing_payment(
            db=db,
            user_id=current_user.id,
            request=request
        )
        
        return APIResponse(
            success=True,
            data=result,
            message="Payment initialized successfully"
        )
    except Exception as e:
        if isinstance(e, (BadRequestException, PaymentException)):
            raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/verify/{reference}", response_model=APIResponse[PaymentVerifyResponse])
async def verify_payment(
    reference: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verify a payment with Paystack
    
    This endpoint verifies the payment status with Paystack and updates
    the database accordingly. On successful payment, the billboard listing
    is activated.
    """
    try:
        payment_data = await payment_service.verify_payment(
            db=db,
            reference=reference,
            user_id=current_user.id
        )
        
        # Send email notification if payment is successful
        if payment_data.status == "completed":
            # Import here to avoid circular dependency
            from app.services.email_service import email_service
            await email_service.send_payment_success_email(
                db=db,
                user_id=current_user.id,
                payment_id=uuid.UUID(payment_data.id)
            )
        
        return APIResponse(
            success=True,
            data={
                "success": True,
                "payment": payment_data,
                "message": "Payment verified successfully"
            },
            message="Payment verified successfully"
        )
    except Exception as e:
        if isinstance(e, (BadRequestException, PaymentException)):
            raise
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=APIResponse[PaymentHistoryResponse])
async def get_payment_history(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's payment history
    
    Returns a paginated list of all payments made by the current user.
    """
    try:
        history = await payment_service.get_user_payment_history(
            db=db,
            user_id=current_user.id,
            page=page,
            page_size=page_size
        )
        
        return APIResponse(
            success=True,
            data=history,
            message="Payment history retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_paystack_signature: Optional[str] = Header(None)
):
    """
    Handle Paystack webhook events
    
    This endpoint receives webhook events from Paystack to notify about
    payment status changes. The webhook signature is verified for security.
    """
    try:
        # Get raw body
        body = await request.body()
        
        # Verify signature
        if not x_paystack_signature:
            raise BadRequestException(detail="Missing webhook signature")
        
        if not paystack_service.verify_webhook_signature(body, x_paystack_signature):
            raise BadRequestException(detail="Invalid webhook signature")
        
        # Parse event data
        event_data = await request.json()
        event_type = event_data.get("event")
        data = event_data.get("data", {})
        
        # Handle the webhook
        success = await payment_service.handle_webhook(
            db=db,
            event_type=event_type,
            event_data=data
        )
        
        if success:
            # Send email notification for successful payments
            if event_type == "charge.success":
                reference = data.get("reference")
                if reference:
                    # Get payment and send email
                    from app.services.email_service import email_service
                    from app.models.payment import Payment
                    from sqlalchemy import select
                    
                    payment_stmt = select(Payment).where(Payment.reference == reference)
                    payment_result = await db.execute(payment_stmt)
                    payment = payment_result.scalar_one_or_none()
                    
                    if payment:
                        await email_service.send_payment_success_email(
                            db=db,
                            user_id=payment.user_id,
                            payment_id=payment.id
                        )
            
            return {"status": "success"}
        else:
            return {"status": "ignored"}
    
    except BadRequestException as e:
        raise
    except Exception as e:
        # Log error but return 200 to acknowledge receipt
        print(f"Webhook error: {str(e)}")
        return {"status": "error", "message": str(e)}


@router.get("/tiers", response_model=APIResponse)
async def get_listing_tiers():
    """
    Get available listing tiers
    
    Returns the pricing tiers for billboard listing access.
    """
    from app.services.payment_service import LISTING_TIERS, LISTING_GRACE_DAYS
    
    tiers = [
        {
            "id": tier_id,
            "duration_days": config["duration_days"],
            "price_ghs": config["price_ghs"],
            "label": f"{config['duration_days']} days"
        }
        for tier_id, config in LISTING_TIERS.items()
    ]
    
    return APIResponse(
        success=True,
        data={
            "tiers": tiers,
            "grace_period_days": LISTING_GRACE_DAYS
        },
        message="Listing tiers retrieved successfully"
    )

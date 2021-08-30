import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { OrderService } from '../../../core/providers/order.service';
import { RazorpayService } from '../../providers/razorpay.service';
import { switchMap, take, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { CheckoutService } from '../../providers/checkout.service';
import {
  updateOrderDetailsGlobally
} from "../../../common/operators/update-order-details-globally.operator";

@Component({
  selector: 'gaushadhi-order-review',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss'],
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  //TODO: Customer data storage API needs brainstorming
  //TODO: GodLike Error Handling
  //TODO: Coupon Codes
  destroy$: Subject<boolean> = new Subject<boolean>();
  customerDetails: any;
  orderDetails: any;
  couponCodeInput = new FormControl('', [Validators.required]);
  appliedCoupons: Set<string> = new Set();
  razorpayFlowActive = false;

  constructor(
    private orderService: OrderService,
    private razorpayService: RazorpayService,
    private route: ActivatedRoute,
    private checkoutService: CheckoutService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkoutService.enableNextButton();
    this.orderService.refreshOrderDetails();

    this.orderService.currentOrderDetails$.pipe(takeUntil(this.destroy$)).
    subscribe((res) => {
      console.log(res);
      this.orderDetails = res;
    });

    this.customerDetails = {
      contact: localStorage.getItem('customerPhNo') || undefined,
      name: localStorage.getItem('customerName'),
      email: localStorage.getItem('customerEmail'),
    };

    this.checkoutService.onNext$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onNext();
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onNext() {
    this.onPayNow();
  }

  async onPayNow() {
    this.razorpayFlowActive = true;
    if (!(await this.razorpayService.loadRazorpayScript())) {
      console.error('Unable to load razorpay script');
      return;
    }
    this.orderService.generateRazorpayOrderId(this.orderDetails.id).pipe(
        updateOrderDetailsGlobally(this.orderService.refreshOrderDetails.bind(this.orderService)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.onRazorpayIdGeneration(res);
      });
  }

  onRazorpayIdGeneration(res: any) {
    if (res.__typename === 'RazorpayOrderIdSuccess') {
      const razorpayOrderId = res.razorpayOrderId;
      this.openRazorpayPopup(razorpayOrderId);
    } else {
      console.log(
        'Some error occurred while generating Razorpay orderId',
        res.message,
        res.errorCode
      );
      this.razorpayFlowActive = false;
      this.cd.detectChanges();
    }
  }

  openRazorpayPopup(razorpayOrderId: string) {
    try {
      const Razorpay = this.razorpayService.Razorpay;
      this.razorpayService.razorpayOrderId = razorpayOrderId;
      this.razorpayService.razorpayPrefill = {
        contact: this.customerDetails.contact,
        email: this.customerDetails.email,
        name: this.customerDetails.name,
      };
      this.razorpayService.razorpaySuccessCallback =
        this.onRazorpayPaymentSuccess.bind(this);
      this.razorpayService.razorpayManualCloseCallback =
        this.onRazorpayManualClose.bind(this);
      const rzp = new Razorpay(this.razorpayService.razorpayOptions);
      rzp.on('payment.failed', (response: any) => {
        console.log(response);
      });
      rzp.open();
    } catch (e) {
      console.log(e);
    }
  }

  onRazorpayPaymentSuccess(metadata: Object) {
    this.razorpayFlowActive = false;
    this.cd.detectChanges();
    this.orderService
      .addRazorpayPaymentToOrder(metadata)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        switch (res.__typename) {
          case 'PaymentFailedError':
          case 'PaymentDeclinedError':
          case 'IneligiblePaymentMethodError':
          case 'OrderPaymentStateError':
            console.log(res.errorCode, res.message);
            break;
          case 'Order':
            console.log('PAYMENT SUCCESSFUL');
            console.log(res);
            this.router.navigateByUrl('/checkout/order-placed');
        }
      });
  }

  onRazorpayManualClose() {
    if (confirm('Are you sure, you want to close the form?')) {
      console.log('Checkout form closed by the user');
      this.razorpayFlowActive = false;

      /**
       * For some reason, angular is not picking up changes when I set
       * this.razorpayFlowActive to false. Even markForCheck is not working
       * NO FUCKING IDEA WHY.
       * So, Using detectChanges for now.
       * **/
      this.cd.detectChanges();
    } else {
      console.log('Complete the Payment');
    }
  }

  onAddCoupon() {
    this.orderService
      .addCouponToOrder(this.couponCodeInput.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        switch (res.__typename) {
          case 'CouponCodeExpiredError':
          case 'CouponCodeInvalidError':
          case 'CouponCodeLimitError':
            console.log(res);
            break;
          case 'Order':
            this.appliedCoupons.add(this.couponCodeInput.value);
            console.log(res);
        }
      });
  }

  onRemoveCoupon(couponCode: string) {
    this.orderService
      .removeCouponFromOrder(couponCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        console.log(res);
        this.appliedCoupons.delete(couponCode);
      });
  }
}

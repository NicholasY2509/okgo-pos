import { PosCheckoutService } from "./pos-checkout-service";
import { PosPaymentService } from "./pos-payment-service";
import { PosTransactionService } from "./pos-transaction-service";
import { PosRedemptionService } from "./pos-redemption-service";
import { PosUtils } from "./pos-utils";

export class PosService {
  static generateTransactionNumber = PosUtils.generateTransactionNumber;
  static generateVoucherCode = PosUtils.generateVoucherCode;
  
  static checkout = PosCheckoutService.checkout;
  static cancelTransaction = PosTransactionService.cancelTransaction;
  static directRedeem = PosRedemptionService.directRedeem;
  static payExistingTransaction = PosPaymentService.payExistingTransaction;
}

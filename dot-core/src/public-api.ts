/*
 * Public API Surface of core
 */

import './lib/extensions/string';
import './lib/extensions/number';
import './lib/extensions/date';
import './lib/extensions/array';
import './lib/extensions/promise';
// import './lib/extensions/object';

export * from './lib/models';
export * from './lib/enums';
export * from './lib/typings';

export * from './lib/logger/log';
export * from './lib/hook-manager/hook-manager';
export * from './lib/hook-manager/hooks-identifiers';

export * from './lib/decorators/hookable.decorator';

export * from './lib/banners.service';
export * from './lib/basket.service';
// export * from './lib/bluetooth.service'; // Only for demo purposes
export * from './lib/combos.service';
export * from './lib/configuration.service';
export * from './lib/content.service'; // Internal service only
export * from './lib/customer.service';
// export * from './lib/diagnose-peripherals.service'; // Under development
export * from './lib/elog.service'; // Internal service only
// export * from './lib/face-recognition.service'; // Only for demo purposes
export * from './lib/internationalization.service';
export * from './lib/kiosk.service';
export * from './lib/localization.service';
export * from './lib/media-creator.service';
export * from './lib/modifiers.service';
export * from './lib/order-area.service';
export * from './lib/order-checkout.service';
export * from './lib/pay-sim-api.service';
export * from './lib/payment.service';
export * from './lib/pos-injector.service';
export * from './lib/print.service';
export * from './lib/promotions.service';
export * from './lib/score.service';
export * from './lib/store-configuration.service';
export * from './lib/suggestive-sales.service';
export * from './lib/scan.service';
export * from './lib/atp-admin.service';
export * from './lib/atp-payment.service';
export * from './lib/atp-files-system.service';
export * from './lib/text-processor.service';

export * from './lib/combo-builder-modifier.service';

export * from './lib/availability.service';
export * from './lib/string-evaluator.service';
export * from './lib/suggestive-sales.service';

export * from './lib/bi-logs.service';
export * from './lib/bi-logs-consumer.service';

export * from './lib/cod.service';

// TEMP until fix native configuration core services to support generic settings
export * from './lib/cod-configuration.service';
export * from './lib/cod-banners.service';
export * from './lib/cod-internationalization.service';
export * from './lib/cod-localization.service';
export * from './lib/cod-pages.service';
export * from './lib/cod-parser.service';
export * from './lib/cod-scanner.service';
export * from './lib/cod-update.service';
export * from './lib/cod-data.service';

export * from './lib/user.service';
export * from './lib/self-check.service';

export * from './externals/mbird-sdk';

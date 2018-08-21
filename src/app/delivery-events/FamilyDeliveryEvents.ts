import { FamilyId } from '../families/families';
import { DeliveryStatusColumn } from "../families/DeliveryStatus";
import { BasketId } from "../families/BasketType";
import { DataProviderFactory, NumberColumn, StringColumn } from 'radweb';
import { evilStatics } from '../auth/evil-statics';
import { HelperId, HelperIdReadonly } from '../helpers/helpers';
import { IdEntity, changeDate, Id } from '../model-shared/types';
import { CallStatusColumn } from '../families/CallStatus';
import { DeliveryEventId } from "./DeliveryEventId";

export class FamilyDeliveryEvents extends IdEntity<FamilyDelveryEventId> {
  deliveryEvent = new DeliveryEventId();
  family = new FamilyId();
  basketType = new BasketId('סוג סל');
  callStatus = new CallStatusColumn('סטטוס שיחה');
  callTime = new changeDate('מועד שיחה');
  callHelper = new HelperIdReadonly('מי ביצעה את השיחה');
  callComments = new StringColumn('הערות שיחה');
  courier = new HelperId("משנע");
  courierAssignUser = new HelperIdReadonly('מי שייכה למשנע');
  courierAssingTime = new changeDate('מועד שיוך למשנע');
  deliverStatus = new DeliveryStatusColumn('סטטוס שינוע');
  deliveryStatusDate = new changeDate('מועד סטטוס שינוע');
  deliveryStatusUser = new HelperIdReadonly('מי עדכן את סטטוס המשלוח');
  routeOrder = new NumberColumn();
  courierComments = new StringColumn('הערות מסירה');
  constructor(source?: DataProviderFactory) {
    super(new FamilyDelveryEventId(), () => new FamilyDeliveryEvents(source), source ? source : evilStatics.dataSource, 'FamilyDeliveryEvents');
    this.initColumns();
  }
}
export class FamilyDelveryEventId extends Id { }
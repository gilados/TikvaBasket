import { ServerAction } from "../auth/server-action";
import { DataApiRequest } from "radweb/utils/dataInterfaces1";
import { myAuthInfo } from "../auth/my-auth-info";
import { Families, DeliveryStatus, Helpers, BasketType } from "../models";
import { foreachSync } from "../shared/utils";


export class GetBasketStatusAction extends ServerAction<GetBasketStatusActionInfo, GetBasketStatusActionResponse>{
    constructor() {
        super('GetBasketStatusAction');//required because of minification
    }
    protected async execute(info: GetBasketStatusActionInfo, req: DataApiRequest<myAuthInfo>): Promise<GetBasketStatusActionResponse> {
        let result = {
            baskets: [],
            cities: []
        };
        let basketHash: any = {};
        let cityHash: any = {};
        let f = new Families();
        let r = await f.source.find({ where: f.deliverStatus.isEqualTo(DeliveryStatus.ReadyForDelivery.id).and(f.courier.isEqualTo('')) });
        r.forEach(cf => {
            if (info.filterLanguage == -1 || info.filterLanguage == cf.language.value) {
                if (!info.filterCity || info.filterCity == cf.city.value) {
                    let bi = basketHash[cf.basketType.value];
                    if (!bi) {
                        bi = {
                            id: cf.basketType.value,
                            unassignedFamilies: 0
                        };
                        basketHash[cf.basketType.value] = bi;
                        result.baskets.push(bi);
                    }
                    bi.unassignedFamilies++;
                }

                let ci: CityInfo = cityHash[cf.city.value];
                if (!ci) {
                    ci = {
                        name: cf.city.value,
                        unassignedFamilies: 0
                    };
                    cityHash[cf.city.value] = ci;
                    result.cities.push(ci);
                }
                ci.unassignedFamilies++;
            }
        });
        if (info.filterCity && !cityHash[info.filterCity]) {
            result.cities.push({ name: info.filterCity, unassignedFamilies: 0 });

        }
        await foreachSync(result.baskets,
            async b => {
                b.name = (await f.lookupAsync(new BasketType(), bt => bt.id.isEqualTo(b.id))).name.value;
            });
        return result;


    }
}

export interface GetBasketStatusActionInfo {
    filterLanguage: number;
    filterCity: string;
}
export interface GetBasketStatusActionResponse {
    baskets: BasketInfo[];
    cities: CityInfo[];
}
export interface BasketInfo {
    name: string;
    id: string;
    unassignedFamilies: number;

}
export interface CityInfo {
    name: string;
    unassignedFamilies: number;
}
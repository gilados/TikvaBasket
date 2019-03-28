import { HelpersAndStats } from "../delivery-follow-up/HelpersAndStats";
import { readFileSync, readFile } from "fs";
import { ColumnHashSet, DateColumn } from "radweb";

import { GetGeoInformation } from "../shared/googleApiHelpers";
import { foreachEntityItem, foreachSync } from "../shared/utils";

import { serverInit } from "./serverInit";
import * as XLSX from 'xlsx';

import { Families, parseAddress } from "../families/families";
import { ServerContext, Context } from "../shared/context";
import { Helpers } from "../helpers/helpers";
import { debug } from "util";
import { FamilySources } from "../families/FamilySources";

serverInit();

export async function DoIt() {
    try {

        let f = await new ServerContext().for(Helpers).count();

        ImportFromExcelBasedOnLetters();

        //   await ImportFromExcel();
    }
    catch (err) {
        console.log(err);
    }

}
DoIt();


async function getGeolocationInfo() {
    let families = new Families(undefined);
    foreachEntityItem(new Families(undefined), undefined, async f => {
        if (!f.getGeocodeInformation().ok()) {
            f.addressApiResult.value = (await GetGeoInformation(f.address.value)).saveToString();
            await f.save();
        }

    });
}
async function ImportFromExcel() {

    let wb = XLSX.readFile("C:\\Users\\Yoni\\Downloads\\רשימת משפחות תחילת עבודה.xlsx");
    for (let sheetIndex = 0; sheetIndex < 1; sheetIndex++) {
        const element = wb.SheetNames[sheetIndex];
        let s = wb.Sheets[element];
        let o = XLSX.utils.sheet_to_json(s);
        let context = new ServerContext();
        let found = true;
        let i = 0;
        await foreachSync(o, async r => {
            try {

                let get = x => {
                    if (!r[x])
                        return '';
                    return r[x];
                };
                await readHesedFamily(context,o,get);
                //await ReadNRUNFamilies(context, r, element, ++i, get);
            }
            catch (err) {
                console.log(err, r);
            }

        });
    }


}
async function ImportFromExcelBasedOnLetters() {

    let wb = XLSX.readFile("C:\\Users\\Yoni\\Downloads\\רשימת משפחות תחילת עבודה.xlsx");
    let context = new ServerContext();
    for (let sheetIndex = 12; sheetIndex < 70; sheetIndex++) {
        const element = wb.SheetNames[sheetIndex];
        let s = wb.Sheets[element];
        let sRef = s["!ref"];
        let rows = +sRef.substring(sRef.indexOf(':') + 2, 10).replace(/\D/g, '');
        if (!rows) {
            debugger;
        }

        for (let row = 1; row < rows; row++) {
            let get = x => {
                let val = s[x + row];
                if (!val)
                    return '';
                return val.w;
            };
            let b = get('B');
            let f = get('F');
            if (b && b != "שם מלא" && f && f != 'כתובת'&&get('A')!="ת.ז "&&b!='ת.ז')
                await ReadNRUNFamilies(context, element, row, get);

        }

        let o = XLSX.utils.sheet_to_json(s);


        let found = true;
        let i = 0;
        await foreachSync(o, async r => {
            try {

                let get = x => {
                    if (!r[x])
                        return '';
                    return r[x];
                };
                // await ReadNRUNFamilies(context, r, element, ++i, get);
            }
            catch (err) {
                console.log(err, r);
            }

        });
    }


}
async function readHelperFromExcel(context: ServerContext, o: any, get: (key: string) => string) {

    let h = context.for(Helpers).create();
    h.phone.value = get('טלפון 1').replace(/\D/g, '');
    h.name.value = get('איש קשר');
    if (h.phone.value && h.phone.value.startsWith('05') && h.name.value.trim().length > 2) {
        await h.save();
    }

}
function onlyDigits(s: string) {
    return s.replace(/\D/g, '');
}
async function ReadNRUNFamilies(context: ServerContext, tabName: string, rowInExcel: number, get: (key: string) => string) {
    let excelId =  tabName + ' ' + (rowInExcel.toString().padStart(3, '0'));
    let f = await context.for(Families).lookupAsync(f=>f.iDinExcel.isEqualTo(excelId));;
    f.iDinExcel.value =excelId;
    f.tz.value = get("A");
    f.name.value = get('B');
    f.familyMembers.value = (+ onlyDigits(get("C")));
    f.phone1.value = get('D');
    let referrer = get("E");
    if (referrer) {
        let mafne = await context.for(FamilySources).lookupAsync(s => s.name.isEqualTo(referrer));
        if (mafne.isNew()) {
            mafne.name.value = referrer;
            await mafne.save();
        }
        f.familySource.value = mafne.id.value;
    }

    let address = parseAddress(get('F'));
    f.address.value = address.address + ' ' + get('H');
    f.floor.value = address.floor;
    f.appartment.value = address.dira;
    if (address.knisa)
        f.addressComment.value = 'כניסה '+address.knisa;
    f.deliveryComments.value = get('I');
    if (get('J')!='1')
        f.internalComment.value = 'מספר סלים '+get('J');

      await f.save();

}
async function readMerkazMazonFamily(context: ServerContext, o: any, get: (key: string) => string) {
    let f = context.for(Families).create();
    f.phone1.value = get('טלפון');
    f.phone2.value = get('טלפון נייד');
    f.iDinExcel.value = get('ת"ז');
    
    f.floor.value = get('קומה');
    f.appartment.value = get('דירה');
    let knisa = get('כניסה');
    if (knisa) {
        f.addressComment.value = 'כניסה ' + knisa;
    }
    f.address.value = get('כתובת') + ' ' + get('בית') + ' ' + get('עיר');
    f.name.value = get('איש קשר');
    f.familyMembers.value = +get('מס נפשות');
    let helperName = get('מתנדב קבוע');
    if (helperName) {
        let h = await context.for(Helpers).lookupAsync(h => h.name.isEqualTo(helperName));
        if (h.isNew()) {
            f.internalComment.value = 'מתנדב לא נמצא בקליטה - ' + helperName;
        }
        else {
            f.courier.value = h.id.value;
        }
    }
    f.deliveryComments.value = get('הערות');
    await f.save();



}

async function readHesedFamily(context: ServerContext, o: any, get: (key: string) => string) {
    let f = context.for(Families).create();
    f.phone1.value = get('טלפון');
    f.phone2.value = get('טלפון נוסף');
    f.name.value = get('שם');
    f.floor.value = get('קומה');
    f.city.value = get('עיר');
    f.basketType.value=get('קוד')
    f.addressComment.value = get('הערה לכתובת');
    f.appartment.value = get('דירה');
    f.address.value = get('כתובת') + ' ' + get('בית')+' '+get('עיר');

    f.deliveryComments.value = get('הערות');
    if(f.deliveryComments.value =='באים לקחת')
        f.special.value=1;
    await f.save();



}

async function updateAddress() {
    (await new Families(undefined).source.find({})).forEach(f => {
        if (f.address.value.indexOf('נתניה') < 0) {
            f.address.value = f.address.value.trim() + ' נתניה';
            f.save();
        }
    });
}

async function updatePhone() {
    (await new Families(undefined).source.find({})).forEach(f => {
        f.phone1.value = '0507330590';
        f.save();
    });
}
function UpdateAllFamiliyNames() {
    readFile(`c:\\temp\\famiilies.txt`, (err, data) => {
        let names = data.toString().split('\r\n');
        new Families(undefined).source.find({}).then(async families => {
            for (let i = 0; i < families.length; i++) {
                families[i].name.value = names[i];
                await families[i].save();
                console.log(i + families[i].name.value);
            }
        });

    });
}
async function imprortFamiliesFromJson() {
    let r = readFileSync(`c:\\temp\\hugmoms.json`);
    var rows = JSON.parse(r.toString());
    for (let i = 0; i < rows.length; i++) {
        let f = new Families(undefined);
        let c = new ColumnHashSet();
        f.__fromPojo(rows[i], c);
        let families = await f.source.find({ where: f.id.isEqualTo(f.id.value) });
        if (families.length == 0) {
            await f.save();
        }
    }
}
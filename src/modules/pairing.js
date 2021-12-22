import {iata2GeoPoint} from "./iata2icao";
import {rad_to_nm} from "./geopoint";

// const getFlightTypePNC = (departure, destination) => {
//     if (departure.longitude >= -30 && departure.longitude <= 40 && departure.latitude >=25
//         && destination.longitude >= -30 && destination.longitude <= 40 && destination.latitude >=25) {
//         return "MC";
//     }
//     return "LC";
// };

export const getFlightTypePNT = (duties) => {
    let flightType = "MT1";
    const layovers = [];
    if (duties.length <= 0 || duties[0].legs.length <= 0) {
        return flightType;
    }
    let base = duties[0].legs[0].departure;
    for (const duty of duties) {
        for (const leg of duty.legs) {
            const distance = leg.departure.distanceTo(leg.arrival, rad_to_nm);
            if (distance > 3000) {
                return "LT";
            } else if (distance > 2100) {
                flightType = "MT2";
            }
        }
        if (duty.legs.length > 0) layovers.push(duty.legs[duty.legs.length - 1].arrival);
    }
    if (flightType === "MT1") return flightType;
    for (const layover of layovers) {
        const meridians = Math.abs(Math.floor(base.longitude/15) - Math.floor(layover.longitude/15));
        if (meridians >= 4) return "LT";
    }
    return flightType; //MT2
};
export const parseDuties = (pairingText, year, month) => {
    const duties = [];
    let duty = {"legs": []};
    let previousIN = null;
    const pattern = /(\d{2})\/(\d{2})\s\S+(\sX)?\s(\S{3})\s>\s(\S{3})\s\(([-+\dh]+)\)\s(\d{2}):(\d{2})\s(?:\d{2}:\d{2})\s(\d{2}):(\d{2})/gu;
    for (const match of pairingText.matchAll(pattern)) {
        const m = parseInt(match[2], 10); // 1-12
        const d = parseInt(match[1], 10);
        const y = (m < month) ? year + 1 : year;
        const scheduledOut = new Date(Date.UTC(y, m - 1, d, parseInt(match[7], 10), parseInt(match[8], 10))); // month must be 0-11
        const blockTime = parseInt(match[10], 10) + parseInt(match[9], 10) * 60;
        const depIATA = match[4];
        const destIATA = match[5];
        const departure = iata2GeoPoint(depIATA);
        const arrival = iata2GeoPoint(destIATA);

        if (previousIN && scheduledOut - previousIN > 36000000) { // more than 10 hours
            duties.push(duty);
            duty = {"legs": []};
        }
        duty.legs.push({
            "depIATA": depIATA,
            departure,
            arrival,
        });
        previousIN = new Date(scheduledOut.getTime() + 60000 * blockTime);
    }
    if (duty.legs.length > 0) duties.push(duty);
    return duties;
}

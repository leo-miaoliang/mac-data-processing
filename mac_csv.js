const geohash = require('ngeohash');
const timestamp = require('time-stamp');
const csvWriter = require('csv-write-stream');
const fs = require('fs')
/*
    export csv mac data
    https://blog.csdn.net/liyantianmin/article/details/82667308
*/
class mac_csv {

    constructor(_path){
        let fields = ['mac', 'mac_company', 'mac_time'
                    ,'mac_lat','mac_lon'
                    ,'geo_hash5','geo_hash6','geo_hash7','geo_hash8','geo_hash9'
                    ,'geo_category','client_id'];
        this.company = ['huawei','apple','vivo','samsung','meizu','zte','gionee','oppo','xiaomi','OnePlus'];
        this.writer = csvWriter({ headers: fields})
        this.writer.pipe(fs.createWriteStream(_path))
    }
    
    get_geohash(_lat,_lon){
        const _geo_hash = []
        _geo_hash.push(geohash.encode(_lat,_lon,5))
        _geo_hash.push(geohash.encode(_lat,_lon,6))
        _geo_hash.push(geohash.encode(_lat,_lon,7))
        _geo_hash.push(geohash.encode(_lat,_lon,8))
        _geo_hash.push(geohash.encode(_lat,_lon,9))
        //console.log(_geo_hash)
        return _geo_hash
    }

    get_datetime(_date){
         return timestamp('YYYYMMDDHHmm',_date)
         //console.log(s_dt)
    }

    check_company(_company){
        if(_company){
            for (let cp of this.company) {
                let cpy = _company.toLocaleLowerCase()
                if(cpy.indexOf(cp) > -1){
                    return true
                }
            }
        }
        return false
    }

    convertToCsvFormat (item) {
        if(item.client_geo && item.client_time && item.is_valid_data && this.check_company(item.mac_company))
        {
            let _lat = item.client_geo.split(',')[0]
            let _lon = item.client_geo.split(',')[1]
            let _mac_hash = this.get_geohash(_lat,_lon)
            let _geo_hash5 = _mac_hash[0]
            let _geo_hash6 = _mac_hash[1]
            let _geo_hash7 = _mac_hash[2]
            let _geo_hash8 = _mac_hash[3]
            let _geo_hash9 = _mac_hash[4]
            let _mac_time = this.get_datetime(new Date(item.client_time))
            let _mac = item.mac
            let _mac_company = item.mac_company
            let _category =  item.category
            let _client_id = item.client_id
            let _row = {
                mac : _mac,
                mac_company : _mac_company,
                mac_time : _mac_time,
                mac_lat : _lat,
                mac_lon : _lon,
                geo_hash5 : _geo_hash5,
                geo_hash6 : _geo_hash6,
                geo_hash7 : _geo_hash7,
                geo_hash8 : _geo_hash8,
                geo_hash9 : _geo_hash9,
                geo_category : _category,
                client_id : _client_id
            }
            this.writer.write(_row)
        }
    }
}

module.exports = mac_csv;
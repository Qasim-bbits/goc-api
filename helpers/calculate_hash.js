var CryptoJS = require("crypto-js");
var bytes = require('utf8-bytes');

module.exports.ah = function(obj){
        let data = '';  
    
    // Concating all parameters      
    
        Object.keys(obj).map(v => data += obj[v])     
        var _hMacKey = null;
        var _normKey = null;
        const BIG_PRIME_NUMBER = 2147483647;
        var iKeyLength = 64;
            if (_hMacKey == null)
            {
                _hMacKey = "3WnO3-3t7Zr1r7tSj5Hp4FA";
            }
            if (_normKey == null)
            {    

    // Convert array into bytes            

                var keyBytes = bytes(_hMacKey);                      
                _normKey = [];
                var iSum = 0;
                
                for (let i = 0; i < iKeyLength; i++)
                {
                    if (i < keyBytes.length)
                    {
                        iSum = iSum + keyBytes[i];                 
                    }
                    else
                    {
                        iSum = iSum + i;
                        
                    }
                _normKey[i] = (iSum * BIG_PRIME_NUMBER) % (255 + 1);
                }
            }
            var inputBytes = bytes(data);
        
    // Convert into WordArray via typed array

            var normKeyWA = CryptoJS.lib.WordArray.create(new Uint8Array(_normKey));
            var inputBytesWA = CryptoJS.lib.WordArray.create(new Uint8Array(inputBytes));
            var hash = CryptoJS.HmacSHA256(
                inputBytesWA,
                normKeyWA
            );            
            var last8Bytes = CryptoJS.lib.WordArray.create(hash.words.slice((32 - 8) / 4));
            var last8BytesHex = last8Bytes.toString(CryptoJS.enc.Hex).toUpperCase();
            return (last8BytesHex)            
    }
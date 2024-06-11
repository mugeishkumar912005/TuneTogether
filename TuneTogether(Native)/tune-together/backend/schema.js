const M=require("mongoose");
const codes=new M.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
      },
},{timestamps:true})
module.exports={codes};
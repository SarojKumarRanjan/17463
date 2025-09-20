import axios from "axios";
import { STACKS, LEVELS, PACKAGES,TOKEN ,URL} from "./constant.js";

export default async function Log(stack, level, packageName, message) {
  try {
    if (!Object.values(STACKS).includes(stack)) {
      throw new Error(`Invalid stack: ${stack}`);
    }
    if (!Object.values(LEVELS).includes(level)) {
      throw new Error(`Invalid level: ${level}`);
    }
    if (!Object.values(PACKAGES).includes(packageName)) {
      throw new Error(`Invalid package: ${packageName}`);
    }
   

    const token = TOKEN;
      
    const apiUrl = URL

    const payload = { stack, level, package: packageName, message };

      const response = await axios.post(apiUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });  

  
    

    const { logID } = response.data;
   
    
    const timestamp = new Date().toISOString();
    return { logID, timestamp };
  } catch (err) {
    console.error(err.message);
    return null;
  }
}

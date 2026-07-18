import { EncryptedERC__factory } from "../../typechain-types";
import { getWallet } from "../../src/utils";
import * as fs from "fs";
import * as path from "path";

const main = async () => {
    // Configure which wallet to use: 1 for first signer, 2 for second signer
    const WALLET_NUMBER = 1;
    
    const wallet = await getWallet(WALLET_NUMBER);
    const auditorPublicKeyAddress = await wallet.getAddress();
    
    // Read addresses from the latest deployment
    const deploymentPath = path.join(__dirname, "../../deployments/converter/latest-converter.json");
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    const eERCAddress = deploymentData.contracts.encryptedERC;
    
    console.log("🔧 Setting auditor for EncryptedERC...");
    console.log("EncryptedERC contract:", eERCAddress);
    console.log("Auditor address:", auditorPublicKeyAddress);
    
    const encryptedERC = await EncryptedERC__factory.connect(eERCAddress, wallet);
    let auditor: any;
    try {
        auditor = await encryptedERC.setAuditorPublicKey(auditorPublicKeyAddress);
        const receipt = await auditor.wait();
        console.log("Transaction confirmed in block:", receipt?.blockNumber);
     
         const auditorAddress = await encryptedERC.auditor();
         const auditorPublicKey = await encryptedERC.auditorPublicKey();
         
         console.log("✅ Auditor successfully configured");
         console.log("Auditor address:", auditorAddress);
         console.log("Auditor public key X:", auditorPublicKey.x.toString());
         console.log("Auditor public key Y:", auditorPublicKey.y.toString());
         
    } catch (error) {
        console.error("❌ Error setting auditor:", error);
        
        // Show more error details
        if (error instanceof Error) {
            console.error("Error message:", error.message);
        }
    }

    
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});

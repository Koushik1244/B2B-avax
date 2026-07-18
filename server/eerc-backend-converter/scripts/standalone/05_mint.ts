import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { privateMint } from "../../test/helpers";
import { getWallet, i0, createUserFromPrivateKey } from "../../src/utils";

const main = async () => {
    // Configure which wallet to use: 1 for first signer (owner), 2 for second signer (user)
    // Can be overridden with environment variable: WALLET_NUMBER=1 or WALLET_NUMBER=2
    const OWNER_WALLET_NUMBER = 1;
    const USER_WALLET_NUMBER = 1;
    
    const owner = await getWallet(OWNER_WALLET_NUMBER);
    const wallet = await getWallet(USER_WALLET_NUMBER);
    const ownerAddress = await owner.getAddress();
    const userAddress = await wallet.getAddress(); // User to mint tokens to
    
    // Mint amount - let's mint 50 tokens (in encrypted system units, which uses 2 decimals)
    const mintAmount = BigInt(50 * 100); // 50 tokens with 2 decimal places
    
    console.log("🪙 Private Minting in Standalone EncryptedERC...");
    console.log("Owner (Minter):", ownerAddress);
    console.log("User (Receiver):", userAddress);
    console.log("Amount to mint:", ethers.formatUnits(mintAmount, 2), "PRIV tokens");
    
    // Read addresses from the latest standalone deployment
    const deploymentPath = path.join(__dirname, "../../deployments/standalone/latest-standalone.json");
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    const encryptedERCAddress = deploymentData.contracts.encryptedERC;
    const registrarAddress = deploymentData.contracts.registrar;
    
    console.log("EncryptedERC:", encryptedERCAddress);
    console.log("Registrar:", registrarAddress);
    
    // Connect to contracts
    const encryptedERC = await ethers.getContractAt("EncryptedERC", encryptedERCAddress, owner);
    const registrar = await ethers.getContractAt("Registrar", registrarAddress, owner);
    
    try {
        // 1. Check if user is registered
        const isUserRegistered = await registrar.isUserRegistered(userAddress);
        if (!isUserRegistered) {
            console.error("❌ User is not registered. Please run the registration script first.");
            console.log("💡 Run: npx hardhat run scripts/standalone/03_register-user.ts --network fuji");
            return;
        }
        console.log("✅ User is registered");
        
        // 2. Check if auditor is set
        const auditor = await encryptedERC.auditor();
        if (auditor === ethers.ZeroAddress) {
            console.error("❌ Auditor is not set. Please run the set-auditor script first.");
            console.log("💡 Run: npx hardhat run scripts/standalone/04_set-auditor.ts --network fuji");
            return;
        }
        console.log("✅ Auditor is set:", auditor);
        
        // 3. Get user's public key for minting
        const userPublicKey = await registrar.getUserPublicKey(userAddress);
        const userPublicKeyArray = [BigInt(userPublicKey[0].toString()), BigInt(userPublicKey[1].toString())];
        console.log("🔑 User public key:", userPublicKeyArray.map(k => k.toString()));
        
        // 4. Get auditor's public key
        const auditorPublicKey = await encryptedERC.auditorPublicKey();
        const auditorPublicKeyArray = [BigInt(auditorPublicKey.x.toString()), BigInt(auditorPublicKey.y.toString())];
        console.log("🔑 Auditor public key:", auditorPublicKeyArray.map(k => k.toString()));
        
        // 5. Generate private mint proof
        console.log("🔐 Generating private mint proof...");
        console.log("⏳ This may take a while...");
        
        const mintProof = await privateMint(
            mintAmount,
            userPublicKeyArray,
            auditorPublicKeyArray
        );
        
        console.log("✅ Mint proof generated successfully");
        
        // 6. Debug the structure first
        console.log("🔍 Debug: mintProof type:", typeof mintProof);
        console.log("🔍 Debug: mintProof structure:", mintProof);
        console.log("🔍 Debug: mintProof keys:", Object.keys(mintProof));
        
        // Try to determine if it's an array or object
        if (Array.isArray(mintProof)) {
            console.log("🔍 Debug: mintProof is an array, length:", mintProof.length);
        } else {
            console.log("🔍 Debug: mintProof is an object");
        }
        
        // For now, let's try using the mintProof directly
        // Since zkit generateCalldata might already return the correct format
        const mintProofStruct = mintProof;
        
        // 7. Call the contract's privateMint function
        console.log("📝 Submitting private mint to contract...");
        
        const mintTx = await encryptedERC.privateMint(
            userAddress,
            mintProofStruct
        );
        
        console.log("📝 Mint transaction sent:", mintTx.hash);
        
        const receipt = await mintTx.wait();
        console.log("✅ Private mint transaction confirmed in block:", receipt?.blockNumber);
        
        console.log("🎉 Private mint completed successfully!");
        console.log(`💰 Minted ${ethers.formatUnits(mintAmount, 2)} PRIV tokens to user ${userAddress}`);
        
        // 8. Show transaction details from events
        if (receipt) {
            const logs = receipt.logs;
            for (const log of logs) {
                try {
                    const parsed = encryptedERC.interface.parseLog(log);
                    if (parsed && parsed.name === "PrivateMint") {
                        const [user, auditorPCT, auditorAddress] = parsed.args;
                        console.log("\n📋 Mint Details:");
                        console.log("  - User:", user);
                        console.log("  - Auditor:", auditorAddress);
                        console.log("  - Audit trail created for compliance");
                    }
                } catch (e) {
                    // Skip logs that can't be parsed by this contract
                }
            }
        }
        
        console.log("\n🎯 Private Mint Summary:");
        console.log(`   From: ${ownerAddress} (Contract Owner)`);
        console.log(`   To: ${userAddress} (User)`);
        console.log(`   Amount: ${ethers.formatUnits(mintAmount, 2)} PRIV tokens`);
        console.log(`   Transaction: ${mintTx.hash}`);
        console.log(`   Status: Privately minted (encrypted on-chain)`);
        
        console.log("\n💡 Next Steps:");
        console.log("   • Check encrypted balance: npx hardhat run scripts/standalone/06_check-balance.ts --network fuji");
        console.log("   • Transfer privately: npx hardhat run scripts/standalone/07_transfer.ts --network fuji");
        console.log("   • Burn tokens: npx hardhat run scripts/standalone/08_burn.ts --network fuji");
        
    } catch (error) {
        console.error("❌ Error during private mint:");
        console.error(error);
        
        if (error instanceof Error) {
            if (error.message.includes("User not registered")) {
                console.error("💡 Hint: The user must be registered first");
            } else if (error.message.includes("Auditor not set")) {
                console.error("💡 Hint: The auditor needs to be set in the EncryptedERC contract");
            } else if (error.message.includes("InvalidProof")) {
                console.error("💡 Hint: The mint proof verification failed - check inputs");
            } else if (error.message.includes("Ownable: caller is not the owner")) {
                console.error("💡 Hint: Only the contract owner can mint tokens in standalone mode");
            } else if (error.message.includes("InvalidOperation")) {
                console.error("💡 Hint: Make sure this is a standalone EncryptedERC contract (not converter)");
            }
        }
        
        throw error;
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
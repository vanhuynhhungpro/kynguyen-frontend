import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function updateTenantBranding() {
    const tenantsRef = db.collection('tenants');
    // Find tenant with domain 'camloliving.localhost:3000' or just 'camloliving.com' if prod
    // Since user is on localhost, we might need to find by name or just list all and update the relevant one.

    console.log("Searching for tenant...");
    const snapshot = await tenantsRef.get();

    if (snapshot.empty) {
        console.log('No tenants found.');
        return;
    }

    let targetTenant = null;
    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`Found tenant: ${doc.id}, Domains: ${data.domains}`);
        if (data.domains && (data.domains.includes('camloliving.localhost:3000') || data.domains.includes('camloliving.com'))) {
            targetTenant = doc;
        }
    });

    if (targetTenant) {
        console.log(`Updating tenant ${targetTenant.id}...`);
        await tenantsRef.doc(targetTenant.id).set({
            branding: {
                homeTemplateId: 'luxe'
            }
        }, { merge: true });
        console.log("✅ Successfully updated homeTemplateId to 'luxe' for tenant:", targetTenant.id);
    } else {
        console.log("❌ Tenant 'camloliving' not found.");
    }
}

updateTenantBranding().catch(console.error);

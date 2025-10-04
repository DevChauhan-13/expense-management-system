import { db } from '@/db';
import { approvalRules } from '@/db/schema';

async function main() {
    const sampleApprovalRules = [
        {
            companyId: 1,
            ruleName: 'Standard Sequential Approval',
            isManagerApprover: true,
            approvalType: 'sequential',
            percentageRequired: null,
            specificApproverId: null,
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(approvalRules).values(sampleApprovalRules);
    
    console.log('✅ Approval rules seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
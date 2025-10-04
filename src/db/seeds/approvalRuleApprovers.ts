import { db } from '@/db';
import { approvalRuleApprovers } from '@/db/schema';

async function main() {
    const sampleApprovalRuleApprovers = [
        {
            approvalRuleId: 1,
            approverId: 2,
            sequenceOrder: 1,
            createdAt: new Date().toISOString(),
        },
        {
            approvalRuleId: 1,
            approverId: 1,
            sequenceOrder: 2,
            createdAt: new Date().toISOString(),
        },
        {
            approvalRuleId: 2,
            approverId: 3,
            sequenceOrder: 1,
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            approvalRuleId: 2,
            approverId: 1,
            sequenceOrder: 2,
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            approvalRuleId: 3,
            approverId: 2,
            sequenceOrder: 1,
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            approvalRuleId: 3,
            approverId: 4,
            sequenceOrder: 2,
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            approvalRuleId: 3,
            approverId: 1,
            sequenceOrder: 3,
            createdAt: new Date('2024-01-20').toISOString(),
        },
        {
            approvalRuleId: 4,
            approverId: 5,
            sequenceOrder: 1,
            createdAt: new Date('2024-02-01').toISOString(),
        },
    ];

    await db.insert(approvalRuleApprovers).values(sampleApprovalRuleApprovers);
    
    console.log('✅ Approval rule approvers seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
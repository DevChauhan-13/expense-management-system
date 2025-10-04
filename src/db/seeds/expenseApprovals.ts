import { db } from '@/db';
import { expenseApprovals } from '@/db/schema';

async function main() {
    const sampleExpenseApprovals = [
        {
            expenseId: 1,
            approverId: 2,
            sequenceOrder: 1,
            status: 'approved',
            comments: 'Approved - valid business travel',
            approvedAt: '2024-01-16T10:30:00.000Z',
            createdAt: new Date().toISOString(),
        },
        {
            expenseId: 1,
            approverId: 1,
            sequenceOrder: 2,
            status: 'approved',
            comments: 'Final approval granted',
            approvedAt: '2024-01-16T14:45:00.000Z',
            createdAt: new Date().toISOString(),
        },
        {
            expenseId: 3,
            approverId: 2,
            sequenceOrder: 1,
            status: 'rejected',
            comments: 'Equipment not approved in current budget',
            approvedAt: '2024-01-11T09:15:00.000Z',
            createdAt: new Date().toISOString(),
        },
        {
            expenseId: 2,
            approverId: 2,
            sequenceOrder: 1,
            status: 'pending',
            comments: null,
            approvedAt: null,
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(expenseApprovals).values(sampleExpenseApprovals);
    
    console.log('✅ ExpenseApprovals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
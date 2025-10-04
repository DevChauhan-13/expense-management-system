import { db } from '@/db';
import { expenses } from '@/db/schema';

async function main() {
    const sampleExpenses = [
        {
            employeeId: 3,
            amount: 250.50,
            originalCurrency: 'USD',
            convertedAmount: 250.50,
            category: 'Travel',
            description: 'Flight tickets to client meeting',
            expenseDate: '2024-01-15',
            status: 'approved',
            companyId: 1,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            employeeId: 3,
            amount: 45.75,
            originalCurrency: 'USD',
            convertedAmount: 45.75,
            category: 'Food',
            description: 'Team lunch during project meeting',
            expenseDate: '2024-01-20',
            status: 'pending',
            companyId: 1,
            createdAt: new Date('2024-01-20T14:30:00Z').toISOString(),
        },
        {
            employeeId: 3,
            amount: 1200.00,
            originalCurrency: 'USD',
            convertedAmount: 1200.00,
            category: 'Equipment',
            description: 'New laptop for development work',
            expenseDate: '2024-01-10',
            status: 'rejected',
            companyId: 1,
            createdAt: new Date('2024-01-10T09:15:00Z').toISOString(),
        },
        {
            employeeId: 2,
            amount: 180.25,
            originalCurrency: 'USD',
            convertedAmount: 180.25,
            category: 'Travel',
            description: 'Uber rides during conference',
            expenseDate: '2024-01-25',
            status: 'approved',
            companyId: 1,
            createdAt: new Date('2024-01-25T16:45:00Z').toISOString(),
        },
        {
            employeeId: 3,
            amount: 89.99,
            originalCurrency: 'USD',
            convertedAmount: 89.99,
            category: 'Other',
            description: 'Software subscription for project tools',
            expenseDate: '2024-01-30',
            status: 'pending',
            companyId: 1,
            createdAt: new Date('2024-01-30T11:20:00Z').toISOString(),
        },
    ];

    await db.insert(expenses).values(sampleExpenses);
    
    console.log('✅ Expenses seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            email: 'admin@techcorp.com',
            name: 'Admin User',
            password: 'hashed_admin_password',
            role: 'admin',
            companyId: 1,
            managerId: null,
            createdAt: new Date('2024-01-10').toISOString(),
        },
        {
            email: 'manager@techcorp.com',
            name: 'Manager User',
            password: 'hashed_manager_password',
            role: 'manager',
            companyId: 1,
            managerId: null,
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            email: 'employee@techcorp.com',
            name: 'Employee User',
            password: 'hashed_employee_password',
            role: 'employee',
            companyId: 1,
            managerId: 2,
            createdAt: new Date('2024-01-15').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enterprisepro.settings')
django.setup()

from django.db import connection

cursor = connection.cursor()
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
""")

tables = cursor.fetchall()

print(f'\n✅ Total tables found: {len(tables)}\n')
print('Tables in enterprisepro_db:')
print('-' * 50)

if tables:
    for table in tables:
        print(f'  - {table[0]}')
else:
    print('  ⚠️  No tables found!')
    print('  Run: python manage.py migrate')

print('-' * 50)


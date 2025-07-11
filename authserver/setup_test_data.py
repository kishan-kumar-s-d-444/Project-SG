from app import create_app, db
from app.models import ConnectedCar

def setup_test_data():
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Create test car
        test_car = ConnectedCar(
            client_id='test_car_1',
            client_secret='test_secret_1',  # Match the secret in test_auth_flow.py
            vin='TEST123456789012345',
            model='Mercedes-Benz S-Class',
            year=2025,
            scopes='engine_start door_unlock',
            scope_categories='basic_operations'
        )
        
        db.session.add(test_car)
        db.session.commit()
        
        print("Test data setup complete!")

if __name__ == '__main__':
    setup_test_data()

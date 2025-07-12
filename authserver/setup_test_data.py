from app import create_app, db
from app.models import ConnectedCar

def setup_test_data():
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        # Create demo car used by Streamlit front-end
        streamlit_car = ConnectedCar(
            client_id='tesla_models_3',
            client_secret='tesla_secret_3',
            vin='TESLA3VIN000000000',
            model='Tesla Model 3',
            year=2025,
            # include all scopes needed for telemetry, download and upload
            scopes='engine_start door_unlock file_download file_upload',
            scope_categories='basic_operations'
        )

        # Optionally keep the original test car too
        legacy_car = ConnectedCar(
            client_id='test_car_1',
            client_secret='test_secret_1',
            vin='TEST123456789012345',
            model='Mercedes-Benz S-Class',
            year=2025,
            scopes='engine_start door_unlock',
            scope_categories='basic_operations'
        )
        
        db.session.add(streamlit_car)
        db.session.add(legacy_car)
        db.session.commit()
        
        print("Test data setup complete!")

if __name__ == '__main__':
    setup_test_data()

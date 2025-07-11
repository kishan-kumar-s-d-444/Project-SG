from app import create_app
from app.models import db, ConnectedCar

app = create_app()

with app.app_context():
    # Create all tables
    db.create_all()
    
    # Create a test car if it doesn't exist
    car1 = ConnectedCar.query.filter_by(client_id='test_car_1').first()
    car2 = ConnectedCar.query.filter_by(client_id='test_car_2').first()
    if not car1:
        car1 = ConnectedCar(
            client_id='test_car_1',
            client_secret='test_secret_1',
            vin='TEST1234567890123',
            model='Test Model',
            year=2025,
            scopes='engine_start door_unlock'
        )
        db.session.add(car1)
        db.session.commit()
        print("Test car created successfully!")
    if not car2:
        car2 = ConnectedCar(
            client_id='test_car_2',
            client_secret='test_secret_2',
            vin='TEST1234567890124',
            model='Test Model',
            year=2025,
            scopes='engine_start door_unlock'
        )
        db.session.add(car2)
        db.session.commit()
        print("Test car created successfully!")
    else:
        print("Test car already exists!")

    # Tesla vehicle configurations
    tesla_configs = [
        ("Model S", 2023), ("Model S", 2024), ("Model S", 2025), ("Model S", 2025), ("Model S", 2024),
        ("Model 3", 2023), ("Model 3", 2024), ("Model 3", 2025), ("Model 3", 2025), ("Model 3", 2024),
        ("Model X", 2023), ("Model X", 2024), ("Model X", 2025), ("Model X", 2025), ("Model X", 2024),
        ("Model Y", 2023), ("Model Y", 2024), ("Model Y", 2025), ("Model Y", 2025), ("Model Y", 2024)
    ]
    
    # Add Tesla vehicles
    for idx, (model, year) in enumerate(tesla_configs, 1):
        car_id = f'tesla_{model.lower().replace(" ", "")}_{idx}'
        existing_car = ConnectedCar.query.filter_by(client_id=car_id).first()
        
        if not existing_car:
            new_car = ConnectedCar(
                client_id=car_id,
                client_secret=f'tesla_secret_{idx}',
                vin=f'TSLA{str(idx).zfill(13)}',
                model=f'Tesla {model}',
                year=year,
                scopes='engine_start door_unlock climate_control battery_status'
            )
            db.session.add(new_car)
            print(f"Added Tesla {model} ({year}) with ID: {car_id}")
    
    # Commit all changes
    db.session.commit()
    print("All Tesla vehicles have been added successfully!")

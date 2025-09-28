import pandas as pd

# Create the data with the new coordinates
data = {
    'image_name': [
        'img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg', 'img5.jpg',
        'img6.jpg', 'img7.jpg', 'img8.jpg', 'img9.jpg', 'img10.jpg',
        'img11.jpg', 'img12.jpg', 'img13.jpg', 'img14.jpg', 'img15.jpg',
        'img16.jpg', 'img17.jpg', 'img18.jpg', 'img19.jpg', 'img20.jpg'
    ],
    'latitude': [
        19.112397, 19.112429, 19.112407, 19.112409, 19.112452,
        19.112397, 19.112388, 19.112397, 19.112318, 19.112185,
        19.112393, 19.11238, 19.112189, 19.112191, 19.112375,
        19.112405, 19.112434, 19.112375, 19.112514, 19.112396
    ],
    'longitude': [
        72.822646, 72.822581, 72.822549, 72.822551, 72.822469,
        72.822645, 72.822487, 72.822643, 72.822419, 72.8223,
        72.822648, 72.822622, 72.822285, 72.822276, 72.822651,
        72.822555, 72.822568, 72.822489, 72.82251, 72.82255
    ],
    'date_taken': [
        '2025-09-26', '2025-09-26', '2025-09-26', '26-09-2025', '2025-09-26',
        '2025-09-26', '2025-09-26', '2025-09-26', '2025-09-26', '2025-09-26',
        '2025-09-26', '2025-09-26', '2025-09-26', '2025-09-26', '2025-09-26',
        '2025-09-26', '2025-09-26', '2025-09-26', '2025-09-26', '2025-09-26'
    ]
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel file
df.to_excel('complete_gps_and_dates.xlsx', index=False)
print("✅ Excel file updated successfully!")
print(f"📊 Total locations: {len(df)}")
print("📍 Sample coordinates:")
for i in range(min(3, len(df))):
    print(f"   {df.iloc[i]['image_name']}: ({df.iloc[i]['latitude']}, {df.iloc[i]['longitude']})")
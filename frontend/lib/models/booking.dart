class Booking {
  final String id;
  final String pnr;
  final String trainId;
  final String trainName;
  final String from;
  final String to;
  final DateTime date;
  final String classType;
  final String status;
  final List<Passenger> passengers;
  final double totalAmount;

  Booking({
    required this.id,
    required this.pnr,
    required this.trainId,
    required this.trainName,
    required this.from,
    required this.to,
    required this.date,
    required this.classType,
    required this.status,
    required this.passengers,
    required this.totalAmount,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['_id'] ?? json['id'] ?? '',
      pnr: json['pnr'] ?? '',
      trainId: json['trainId'] ?? '',
      trainName: json['trainName'] ?? '',
      from: json['from'] ?? '',
      to: json['to'] ?? '',
      date: DateTime.parse(json['date']),
      classType: json['classType'] ?? '',
      status: json['status'] ?? '',
      passengers: (json['passengers'] as List<dynamic>?)
              ?.map((p) => Passenger.fromJson(p))
              .toList() ??
          [],
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
    );
  }
}

class Passenger {
  final String name;
  final int age;
  final String gender;

  Passenger({
    required this.name,
    required this.age,
    required this.gender,
  });

  factory Passenger.fromJson(Map<String, dynamic> json) {
    return Passenger(
      name: json['name'] ?? '',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'age': age,
      'gender': gender,
    };
  }
}

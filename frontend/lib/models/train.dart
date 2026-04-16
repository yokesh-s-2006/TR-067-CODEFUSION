class Train {
  final String id;
  final String name;
  final String from;
  final String to;
  final String departure;
  final String arrival;
  final String duration;
  final int seatsAvailable;
  final Map<String, double> price;

  Train({
    required this.id,
    required this.name,
    required this.from,
    required this.to,
    required this.departure,
    required this.arrival,
    required this.duration,
    required this.seatsAvailable,
    required this.price,
  });

  factory Train.fromJson(Map<String, dynamic> json) {
    return Train(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      from: json['from'] ?? '',
      to: json['to'] ?? '',
      departure: json['departure'] ?? '',
      arrival: json['arrival'] ?? '',
      duration: json['duration'] ?? '',
      seatsAvailable: json['seatsAvailable'] ?? 0,
      price: Map<String, double>.from(
        (json['price'] ?? {}).map((k, v) => MapEntry(k, (v as num).toDouble())),
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'from': from,
      'to': to,
      'departure': departure,
      'arrival': arrival,
      'duration': duration,
      'seatsAvailable': seatsAvailable,
      'price': price,
    };
  }
}

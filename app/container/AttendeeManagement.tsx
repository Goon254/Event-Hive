// app/container/AttendeeManagement.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'confirmed' | 'checked-in';
  checkInTime?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  attendeeCard: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attendeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  attendeeStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkInButton: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

interface AttendeeManagementProps {
  eventId: string;
  attendees: Attendee[];
  onUpdateAttendee: (attendeeId: string, status: string) => void;
}

export default function AttendeeManagement({
  eventId,
  attendees,
  onUpdateAttendee,
}: AttendeeManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'checked-in'>('all');

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && attendee.status === selectedFilter;
  });

  const handleCheckIn = (attendeeId: string) => {
    Alert.alert(
      'Confirm Check-in',
      'Do you want to check in this attendee?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Check In',
          onPress: () => onUpdateAttendee(attendeeId, 'checked-in'),
        },
      ]
    );
  };

  const renderAttendee = ({ item }: { item: Attendee }) => (
    <View style={styles.attendeeCard}>
      <View style={styles.attendeeDetails}>
        <View>
          <Text style={styles.attendeeName}>{item.name}</Text>
          <Text style={styles.attendeeEmail}>{item.email}</Text>
          <Text style={styles.attendeeStatus}>Status: {item.status}</Text>
        </View>
        {item.status !== 'checked-in' && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => handleCheckIn(item.id)}
          >
            <Text style={styles.checkInButtonText}>Check In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search attendees..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setSelectedFilter(selectedFilter === 'all' ? 'pending' : 'all')}
        >
          <Text style={styles.filterText}>
            {selectedFilter === 'all' ? 'Pending' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredAttendees}
        keyExtractor={(item) => item.id}
        renderItem={renderAttendee}
        ListEmptyComponent={<Text>No attendees found</Text>}
      />
    </View>
  );
}

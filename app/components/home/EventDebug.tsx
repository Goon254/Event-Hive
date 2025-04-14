import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Event } from '../../services/eventServices';

interface EventDebugProps {
  events: Event[];
  title: string;
}

/**
 * EventDebug component - displays raw event data for debugging
 */
const EventDebug = ({ events, title }: EventDebugProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title} ({events.length})</Text>
      <ScrollView style={styles.scrollView}>
        {events.length > 0 ? (
          events.map((event, index) => (
            <View key={event.id} style={styles.eventItem}>
              <Text style={styles.eventTitle}>Event {index + 1}: {event.title}</Text>
              <Text style={styles.eventDetail}>ID: {event.id}</Text>
              <Text style={styles.eventDetail}>Date: {event.date ? event.date.toString() : 'No date'}</Text>
              <Text style={styles.eventDetail}>Location: {event.location || 'No location'}</Text>
              <Text style={styles.eventDetail}>Image URL: {event.imageUrl || 'No image'}</Text>
              <Text style={styles.eventDetail}>Created By: {event.createdBy || 'Unknown'}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEvents}>No events to display</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
    margin: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  scrollView: {
    maxHeight: 300,
  },
  eventItem: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  eventDetail: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 3,
  },
  noEvents: {
    color: '#ff6b6b',
    fontStyle: 'italic',
  }
});

export default EventDebug;
/**
 * Preview styles for the Event Creation flow
 * Includes styles for the event preview modal
 */

import { StyleSheet, Platform } from 'react-native';

const previewStyles = StyleSheet.create({
  // Preview container
  previewContainer: {
    flex: 1,
    backgroundColor: '#121212', // Dark background to match Home.tsx
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: 'transparent', // Transparent to show gradient
    borderBottomWidth: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, 
    shadowRadius: 2,
  },
  previewHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closePreviewButton: {
    padding: 8,
  },
  previewScroll: {
    flex: 1,
  },
  
  // Banner section
  previewBanner: {
    height: 200,
    position: 'relative',
  },
  previewBannerImage: {
    width: '100%',
    height: '100%',
  },
  previewBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D2D2D', // Darker placeholder for dark mode
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBannerText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  previewBannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  previewBannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  previewEventType: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  previewEventTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  previewOrganizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewOrganizerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
  
  // Details section
  previewDetails: {
    padding: 16,
  },
  previewDetailCard: {
    backgroundColor: 'rgba(45, 45, 45, 0.85)', // Dark card background
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2D2D2D', // Darker border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  previewDetailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  previewDetailContent: {
    marginLeft: 12,
    flex: 1,
  },
  previewDetailLabel: {
    fontSize: 14,
    color: '#9CA3AF', // Lighter gray for dark mode
    marginBottom: 4,
  },
  previewDetailText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  previewDetailTextSecondary: {
    fontSize: 14,
    color: '#9CA3AF', // Lighter gray for dark mode
    marginTop: 2,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#2D2D2D', // Darker divider
    marginVertical: 4,
  },
  previewTicketPrice: {
    fontSize: 14,
    color: '#00BFA6', // Updated to primary teal color
    marginTop: 2,
  },
  
  // Content sections
  previewSection: {
    marginBottom: 24,
    padding: 16,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  previewDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)', // Slightly dimmed white text
    lineHeight: 24,
  },
  
  // Category and tags
  previewCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewCategory: {
    backgroundColor: 'rgba(0, 191, 166, 0.1)', // Light teal background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewCategoryText: {
    color: '#00BFA6', // Updated to primary teal color
    fontSize: 14,
    fontWeight: '500',
  },
  previewTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Translucent white
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewTagText: {
    color: 'rgba(255,255,255,0.8)', // Slightly dimmed white text
    fontSize: 14,
  },
  
  // Speaker cards
  previewSpeakerCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  previewSpeakerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  previewSpeakerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  previewSpeakerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D2D2D', // Darker placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSpeakerImagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  previewSpeakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  previewSpeakerRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)', // Slightly dimmed white text
    textAlign: 'center',
  },
});

export default previewStyles;
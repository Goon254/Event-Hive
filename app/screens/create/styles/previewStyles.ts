/**
 * Preview styles for the Event Creation flow
 * Includes styles for the event preview modal
 */

import { StyleSheet, Platform } from 'react-native';

const previewStyles = StyleSheet.create({
  // Preview container
  previewContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, 
    shadowRadius: 2,
  },
  previewHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
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
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#6B7280',
    marginBottom: 4,
  },
  previewDetailText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  previewDetailTextSecondary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  previewTicketPrice: {
    fontSize: 14,
    color: '#10B981',
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
    color: '#1F2937',
    marginBottom: 12,
  },
  previewDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  
  // Category and tags
  previewCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewCategory: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewCategoryText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '500',
  },
  previewTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewTagText: {
    color: '#4B5563',
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
    backgroundColor: '#E5E7EB',
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
    color: '#1F2937',
    textAlign: 'center',
  },
  previewSpeakerRole: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default previewStyles;
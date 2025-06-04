
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';



import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

dayjs.extend(utc);
dayjs.extend(timezone);

const BASE_URL = 'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const router = useRouter();
  
  // State management
  const [useNYC, setUseNYC] = useState(true);
  const [storeTimes, setStoreTimes] = useState([]);
  const [storeOverrides, setStoreOverrides] = useState([]);
  const [localTz, setLocalTz] = useState('');
  const [localCity, setLocalCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userName, setUserName] = useState('');
  
  useEffect(() => {
    const loadUser = async () => {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName) setUserName(storedName);
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      await AsyncStorage.removeItem('userName');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout failed', error.message);
    }
  };

  useEffect(() => {
    initializeApp();
    requestNotificationPermissions();
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Update time slots when date or timezone changes
  useEffect(() => {
    if (selectedDate) {
      generateTimeSlots();
    }
  }, [selectedDate, useNYC, storeTimes, storeOverrides]);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  };

  const initializeApp = async () => {
    try {
      await Promise.all([
        fetchStoreData(),
        loadStoredPreferences(),
        detectLocalTimezone(),
      ]);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert('Error', 'Failed to load store data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreData = async () => {
    try {
      const headers = {
        'Authorization': 'Basic ' + btoa('perdiem:perdiem'),
        'Content-Type': 'application/json',
      };

      const [storeRes, overrideRes] = await Promise.all([
        fetch(`${BASE_URL}/store-times/`, { headers }),
        fetch(`${BASE_URL}/store-overrides/`, { headers }),
      ]);

      if (!storeRes.ok || !overrideRes.ok) {
        throw new Error('Failed to fetch data from API');
      }

      const storeData = await storeRes.json();
      const overrideData = await overrideRes.json();

      setStoreTimes(storeData);
      setStoreOverrides(overrideData);
      
      console.log('Store times loaded:', storeData);
      console.log('Store overrides loaded:', overrideData);
    } catch (error) {
      console.error('API fetch error:', error);
      setStoreTimes([
        { id: '1', day_of_week: 1, is_open: true, start_time: '09:00', end_time: '17:00' },
        { id: '2', day_of_week: 2, is_open: true, start_time: '09:00', end_time: '17:00' },
        { id: '3', day_of_week: 3, is_open: true, start_time: '09:00', end_time: '17:00' },
        { id: '4', day_of_week: 4, is_open: true, start_time: '09:00', end_time: '17:00' },
        { id: '5', day_of_week: 5, is_open: true, start_time: '09:00', end_time: '17:00' },
        { id: '6', day_of_week: 6, is_open: true, start_time: '10:00', end_time: '16:00' },
        { id: '7', day_of_week: 0, is_open: false, start_time: null, end_time: null },
      ]);
      setStoreOverrides([]);
    }
  };

  const loadStoredPreferences = async () => {
    try {
      const savedUseNYC = await AsyncStorage.getItem('useNYC');
      const savedSelectedSlot = await AsyncStorage.getItem('selectedSlot');
      
      if (savedUseNYC !== null) {
        setUseNYC(JSON.parse(savedUseNYC));
      }
      
      if (savedSelectedSlot !== null) {
        setSelectedSlot(JSON.parse(savedSelectedSlot));
      }
    } catch (error) {
      console.error('Failed to load stored preferences:', error);
    }
  };

  const detectLocalTimezone = () => {
    try {
      const detected = dayjs.tz.guess();
      setLocalTz(detected);
      
      const cityName = detected.split('/').pop().replace('_', ' ');
      setLocalCity(cityName);
      
      console.log('Detected timezone:', detected, 'City:', cityName);
    } catch (error) {
      console.error('Failed to detect timezone:', error);
      setLocalTz('America/Los_Angeles'); // Fallback
      setLocalCity('Los Angeles');
    }
  };

  const handleToggleTimezone = async () => {
    const newValue = !useNYC;
    setUseNYC(newValue);
    
    try {
      await AsyncStorage.setItem('useNYC', JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save timezone preference:', error);
    }
  };

  const getCurrentTimezone = () => {
    return useNYC ? 'America/New_York' : localTz;
  };

  const getDisplayCity = () => {
    return useNYC ? 'NYC' : localCity;
  };

  const getGreeting = () => {
    const currentTz = getCurrentTimezone();
    const timeInTz = currentTime.tz(currentTz);
    const hour = timeInTz.hour();
    const city = getDisplayCity();

    if (hour >= 5 && hour < 10) return `Good Morning, ${city}!`;
    if (hour >= 10 && hour < 12) return `Late Morning Vibes! ${city}`;
    if (hour >= 12 && hour < 17) return `Good Afternoon, ${city}!`;
    if (hour >= 17 && hour < 21) return `Good Evening, ${city}!`;
    return `Night Owl in ${city}!`;
  };

  const isStoreOpen = (checkDate = null) => {
    const currentTz = getCurrentTimezone();
    const timeToCheck = checkDate ? checkDate.tz(currentTz) : currentTime.tz(currentTz);
    const dayOfWeek = timeToCheck.day();
    const currentTimeStr = timeToCheck.format('HH:mm');
    
    console.log(`Checking store status for: ${timeToCheck.format('YYYY-MM-DD HH:mm')}, Day: ${dayOfWeek}`);
    
    const override = storeOverrides.find(
      o => o.month === (timeToCheck.month() + 1) && o.day === timeToCheck.date()
    );
    
    if (override) {
      console.log('Found override:', override);
      if (!override.is_open) return false;
      
      // If checking current time, compare with actual time
      if (!checkDate) {
        return currentTimeStr >= override.start_time && currentTimeStr < override.end_time;
      }
      return true;
    }
    
    // Check regular store hours
    const todayHours = storeTimes.filter(
      t => t.day_of_week === dayOfWeek && t.is_open
    );
    
    console.log('Found store hours:', todayHours);
    
    if (todayHours.length === 0) return false;
    
    if (!checkDate) {
      return todayHours.some(
        h => currentTimeStr >= h.start_time && currentTimeStr < h.end_time
      );
    }
    
    return true;
  };

  const generateNext30Days = () => {
    const currentTz = getCurrentTimezone();
    const today = dayjs().tz(currentTz);
    
    return Array.from({ length: 30 }, (_, i) => {
      return today.add(i, 'day');
    });
  };

  const generateTimeSlots = () => {
    if (!selectedDate) return;
    
    const currentTz = getCurrentTimezone();
    const dateInTz = selectedDate.tz(currentTz);
    const dayOfWeek = dateInTz.day();
    
    console.log('Generating slots for:', dateInTz.format('YYYY-MM-DD'), 'Day of week:', dayOfWeek);
    
    const override = storeOverrides.find(
      o => o.month === (dateInTz.month() + 1) && o.day === dateInTz.date()
    );
    
    let operatingHours = [];
    
    if (override) {
      console.log('Found override:', override);
      if (override.is_open) {
        operatingHours = [{
          start_time: override.start_time,
          end_time: override.end_time
        }];
      }
    } else {
      operatingHours = storeTimes
        .filter(t => t.day_of_week === dayOfWeek && t.is_open)
        .map(t => ({
          start_time: t.start_time,
          end_time: t.end_time
        }));
    }
    
    console.log('Operating hours:', operatingHours);
    
    if (operatingHours.length === 0) {
      setTimeSlots([]);
      return;
    }
    
    const slots = [];
    
    operatingHours.forEach(({ start_time, end_time }) => {
      const startDateTime = dayjs.tz(
        `${dateInTz.format('YYYY-MM-DD')}T${start_time}`,
        currentTz
      );
      const endDateTime = dayjs.tz(
        `${dateInTz.format('YYYY-MM-DD')}T${end_time}`,
        currentTz
      );
      
      let current = startDateTime;
      while (current.isBefore(endDateTime)) {
        slots.push({
          time: current.format('HH:mm'),
          display: current.format('h:mm A'),
          datetime: current
        });
        current = current.add(15, 'minute');
      }
    });
    
    console.log('Generated slots:', slots.length);
    setTimeSlots(slots);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null); 
  };

  const handleSlotSelect = async (slot) => {
    setSelectedSlot(slot);
    
    try {
      await AsyncStorage.setItem('selectedSlot', JSON.stringify(slot));
    } catch (error) {
      console.error('Failed to save selected slot:', error);
    }
  };

  const scheduleNotification = async (slotDateTime) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      const notificationTime = slotDateTime.subtract(1, 'hour');
      const now = dayjs();
      
      if (notificationTime.isAfter(now)) {
        const trigger = notificationTime.toDate();
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Store Opening Soon!',
            body: `The store will open in 1 hour at ${slotDateTime.format('h:mm A')}`,
            sound: true,
          },
          trigger,
        });
        
        console.log('Notification scheduled for:', notificationTime.format('YYYY-MM-DD HH:mm'));
      }
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  };

  const getNextStoreOpening = () => {
    const currentTz = getCurrentTimezone();
    const now = dayjs().tz(currentTz);
    
    for (let i = 0; i < 7; i++) {
      const checkDate = now.add(i, 'day');
      const dayOfWeek = checkDate.day();
      
      // Check for override
      const override = storeOverrides.find(
        o => o.month === (checkDate.month() + 1) && o.day === checkDate.date()
      );
      
      let openingTimes = [];
      
      if (override) {
        if (override.is_open) {
          openingTimes = [override.start_time];
        }
      } else {
        const hours = storeTimes.filter(t => t.day_of_week === dayOfWeek && t.is_open);
        openingTimes = hours.map(h => h.start_time);
      }
      
      for (const openTime of openingTimes) {
        const openDateTime = dayjs.tz(
          `${checkDate.format('YYYY-MM-DD')}T${openTime}`,
          currentTz
        );
        
        if (i === 0 && openDateTime.isBefore(now)) {
          continue;
        }
        
        return openDateTime;
      }
    }
    
    return null;
  };

  const handleConfirmSelection = async () => {
    if (selectedDate && selectedSlot) {
      setShowConfirmation(true);
      
      const nextOpening = getNextStoreOpening();
      if (nextOpening) {
        await scheduleNotification(nextOpening);
      }
      
      setTimeout(() => {
        setShowConfirmation(false);
      }, 3000);
    }
  };

  const renderDateList = () => {
    const dates = generateNext30Days();
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>

        {dates.map((date, index) => {
          const isSelected = selectedDate && selectedDate.isSame(date, 'day');
          const isToday = date.isSame(dayjs(), 'day');
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateButton,
                isSelected && styles.selectedDateButton,
                isToday && styles.todayButton
              ]}
              onPress={() => handleDateSelect(date)}
            >
              <Text style={[
                styles.dateButtonText,
                isSelected && styles.selectedDateText,
                isToday && styles.todayText
              ]}>
                {date.format('MMM DD')}
              </Text>
              <Text style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                isToday && styles.todayDayText
              ]}>
                {date.format('ddd')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

        <View style={styles.header}>
        <Text style={styles.title}>Select a Time Slot</Text>
        <Text style={styles.greeting}>{getGreeting()}</Text>
      </View>

  const renderTimeSlots = () => {
    if (!selectedDate) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Select a date to view available time slots</Text>
        </View>
      );
    }

    if (timeSlots.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Store is closed on this date</Text>
        </View>
      );
    }

    return (
      <View style={styles.slotsContainer}>
        {timeSlots.map((slot, index) => {
          const isSelected = selectedSlot && selectedSlot.time === slot.time;
          
          return (
            <TouchableOpacity
              key={index}
              style={[styles.slotButton, isSelected && styles.selectedSlotButton]}
              onPress={() => handleSlotSelect(slot)}
            >
              <Text style={[styles.slotText, isSelected && styles.selectedSlotText]}>
                {slot.display}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EF1A2D" />
        <Text style={styles.loadingText}>Loading store information...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                    <View style={styles.topRightContainer}>
            <Text style={styles.userText}>Hi, {userName}</Text>
            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            </View>
      <View style={styles.statusContainer}>
        <View style={styles.statusIndicator}>
          <View style={[styles.statusLight, { backgroundColor: isStoreOpen() ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            Store is {isStoreOpen() ? 'Open' : 'Closed'} now
          </Text>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <Text style={styles.toggleLabel}>
          Timezone: {useNYC ? 'New York' : `${localCity} (Local)`}
        </Text>
        <Switch
          value={useNYC}
          onValueChange={handleToggleTimezone}
          trackColor={{ false: '#767577', true: '#EF1A2D' }}
          thumbColor={useNYC ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.currentTimeLabel}>Current Time:</Text>
        <Text style={styles.currentTime}>
          {currentTime.tz(getCurrentTimezone()).format('MMMM DD, YYYY - h:mm A')}
        </Text>
        <Text style={styles.timezoneLabel}>
          ({useNYC ? 'New York' : localCity} time)
        </Text>
      </View>


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select a Date</Text>
        {renderDateList()}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Time Slots (15-min intervals)</Text>
        {renderTimeSlots()}
      </View>

      {selectedSlot && selectedDate && (
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>Your Selection</Text>
          <Text style={styles.selectionText}>
            {selectedDate.format('MMMM DD, YYYY')} at {selectedSlot.display}
          </Text>
          <Text style={styles.selectionTimezone}>
            ({useNYC ? 'New York' : localCity} time)
          </Text>
          
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmSelection}
          >
            <Text style={styles.confirmButtonText}>Confirm Selection</Text>
          </TouchableOpacity>
        </View>
      )}

      {showConfirmation && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationPopup}>
            <Text style={styles.confirmationTitle}>✅ Booking Confirmed!</Text>
            <Text style={styles.confirmationText}>
              {selectedDate.format('MMMM DD, YYYY')} at {selectedSlot.display}
            </Text>
            <Text style={styles.confirmationTimezone}>
              ({useNYC ? 'New York' : localCity} time)
            </Text>
            <Text style={styles.notificationText}>
              📱 You'll receive a notification 1 hour before the store opens
            </Text>
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={() => setShowConfirmation(false)}
            >
              <Text style={styles.dismissButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ 
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topRightContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  userText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  logoutText: {
    fontSize: 14,
    color: '#EF1A2D',
    fontWeight: '600',
  },  
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    color: '#EF1A2D',
    fontWeight: '600',
  },
  statusContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusLight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  timezoneLabel: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dateScrollView: {
    flexGrow: 0,
  },
  dateButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedDateButton: {
    backgroundColor: '#EF1A2D',
  },
  todayButton: {
    borderWidth: 2,
    borderColor: '#EF1A2D',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedDateText: {
    color: 'white',
  },
  todayText: {
    color: '#EF1A2D',
  },
  dayText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedDayText: {
    color: 'white',
  },
  todayDayText: {
    color: '#EF1A2D',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedSlotButton: {
    backgroundColor: '#EF1A2D',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedSlotText: {
    color: 'white',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  selectionContainer: {
    backgroundColor: '#EF1A2D',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  selectionText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  selectionTimezone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#EF1A2D',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  confirmationPopup: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  confirmationTimezone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  dismissButton: {
    backgroundColor: '#EF1A2D',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dismissButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});
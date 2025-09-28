import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Card } from '~/components/ui/card';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { H2 } from '~/components/ui/typography';
import { Text } from '~/components/ui/text';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';

const Form = () => {
  const headerHeight = useHeaderHeight();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    email: '',
    panNumber: '',
    aadhaarNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = async () => {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const parsedData = JSON.parse(userData);
        const profile = parsedData.profile || {};
        const address = profile.address || {};

        setFormData({
          fullName: profile.fullName || parsedData.username || '',
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || '',
          contactNumber: profile.contactNumber || '',
          email: parsedData.email || '',
          panNumber: profile.panNumber || '',
          aadhaarNumber: profile.aadhaarNumber || '',
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          pincode: address.pincode || '',
          country: address.country || '',
        });
        setHasExistingData(true);
      }
    } catch (error) {
      console.error('Error loading existing user data:', error);
      setErrorMessage('Failed to load existing user data');
      setShowErrorDialog(true);
    }
  };

  const DisplayField = ({ label, value }) => (
    <View className="mb-4">
      <Label className="mb-1 text-gray-600">{label}</Label>
      <Text className="text-base">{value?.toString() || 'Not provided'}</Text>
    </View>
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const existingUserData = await AsyncStorage.getItem('currentUser');
      const parsedExistingData = existingUserData ? JSON.parse(existingUserData) : {};

      const updatedUserData = {
        ...parsedExistingData,
        id: parsedExistingData.id,
        username: formData.fullName || parsedExistingData.username,
        image: parsedExistingData.image,
        email: formData.email || parsedExistingData.email,
        created_at: parsedExistingData.created_at,
        updated_at: new Date().toISOString(),
        is_synced: false,
        profile: {
          fullName: formData.fullName,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          contactNumber: formData.contactNumber,
          panNumber: formData.panNumber,
          aadhaarNumber: formData.aadhaarNumber,
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            country: formData.country,
          },
        },
      };

      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUserData));
      setShowSuccessDialog(true);
      setIsEditMode(false);
    } catch (error) {
      console.error('Error saving form data:', error);
      setErrorMessage('Failed to save profile data');
      setShowErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const requiredFields = [
      'fullName',
      'dateOfBirth',
      'gender',
      'contactNumber',
      'email',
      'panNumber',
    ];
    return requiredFields.every((field) => formData[field]?.trim());
  };

  const renderContent = () => {
    if (hasExistingData && !isEditMode) {
      return (
        <View className="gap-8">
          <Card className="p-4">
            <H2 className="mb-4">Basic Personal Information</H2>
            <DisplayField label="Full Name" value={formData.fullName} />
            <DisplayField label="Date of Birth" value={formData.dateOfBirth} />
            <DisplayField label="Gender" value={formData.gender} />
            <DisplayField label="Contact Number" value={formData.contactNumber} />
            <DisplayField label="Email Address" value={formData.email} />
          </Card>

          <Card className="p-4">
            <H2 className="mb-4">Identity Verification</H2>
            <DisplayField label="PAN Number" value={formData.panNumber} />
            <DisplayField label="Aadhaar Number" value={formData.aadhaarNumber} />
          </Card>

          <Card className="p-4">
            <H2 className="mb-4">Address Details</H2>
            <DisplayField label="Street Address" value={formData.street} />
            <DisplayField label="City" value={formData.city} />
            <DisplayField label="State" value={formData.state} />
            <DisplayField label="Pincode" value={formData.pincode} />
            <DisplayField label="Country" value={formData.country} />
          </Card>

          <Button onPress={() => setIsEditMode(true)} className="mt-4">
            <Text className="text-primary-foreground">Edit Profile</Text>
          </Button>
        </View>
      );
    }

    return (
      <View className="gap-8">
        {/* Basic Personal Information */}
        <View>
          <H2 className="mb-4">Basic Personal Information</H2>
          <View className="gap-4">
            <View>
              <Label className="mb-2">Full Name (as per PAN)</Label>
              <Input
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(text) => handleChange('fullName', text)}
              />
            </View>

            <View>
              <Label className="mb-2">Date of Birth</Label>
              <Input
                placeholder="DD/MM/YYYY"
                value={formData.dateOfBirth}
                onChangeText={(text) => handleChange('dateOfBirth', text)}
              />
            </View>

            <View>
              <Label className="mb-2">Gender</Label>
              <RadioGroup
                className="flex-row gap-4"
                value={formData.gender}
                onValueChange={(value) => handleChange('gender', value)}>
                <View className="flex-row items-center">
                  <RadioGroupItem value="male" id="male" />
                  <Label className="ml-2" htmlFor="male">
                    Male
                  </Label>
                </View>
                <View className="flex-row items-center">
                  <RadioGroupItem value="female" id="female" />
                  <Label className="ml-2" htmlFor="female">
                    Female
                  </Label>
                </View>
                <View className="flex-row items-center">
                  <RadioGroupItem value="other" id="other" />
                  <Label className="ml-2" htmlFor="other">
                    Other
                  </Label>
                </View>
              </RadioGroup>
            </View>

            <View>
              <Label className="mb-2">Contact Number (Mobile)</Label>
              <Input
                placeholder="Enter mobile number"
                keyboardType="phone-pad"
                value={formData.contactNumber}
                onChangeText={(text) => handleChange('contactNumber', text)}
              />
            </View>

            <View>
              <Label className="mb-2">Email Address</Label>
              <Input
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
              />
            </View>
          </View>
        </View>

        {/* Identity Verification */}
        <View>
          <H2 className="mb-4">Identity Verification</H2>
          <View className="gap-4">
            <View>
              <Label className="mb-2">PAN Number</Label>
              <Input
                placeholder="Enter PAN number"
                autoCapitalize="characters"
                value={formData.panNumber}
                onChangeText={(text) => handleChange('panNumber', text)}
              />
            </View>

            <View>
              <Label className="mb-2">Aadhaar Number (Optional)</Label>
              <Input
                placeholder="Enter Aadhaar number"
                keyboardType="numeric"
                value={formData.aadhaarNumber}
                onChangeText={(text) => handleChange('aadhaarNumber', text)}
              />
            </View>
          </View>
        </View>

        {/* Address Details */}
        <View>
          <H2 className="mb-4">Address Details</H2>
          <View className="gap-4">
            <View>
              <Label className="mb-2">Street Address</Label>
              <Input
                placeholder="Enter street address"
                value={formData.street}
                onChangeText={(text) => handleChange('street', text)}
              />
            </View>

            <View>
              <Label className="mb-2">City</Label>
              <Input
                placeholder="Enter city"
                value={formData.city}
                onChangeText={(text) => handleChange('city', text)}
              />
            </View>

            <View>
              <Label className="mb-2">State</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="maharashtra" label="Maharashtra" />
                    <SelectItem value="delhi" label="Delhi" />
                    <SelectItem value="karnataka" label="Karnataka" />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </View>

            <View>
              <Label className="mb-2">Pincode</Label>
              <Input
                placeholder="Enter pincode"
                keyboardType="numeric"
                value={formData.pincode}
                onChangeText={(text) => handleChange('pincode', text)}
              />
            </View>

            <View>
              <Label className="mb-2">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleChange('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="india" label="India" />
                  </SelectGroup>
                </SelectContent>
              </Select>
            </View>
          </View>
        </View>

        <View className="mb-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isSubmitting || !isFormValid()}>
                <Text>{isSubmitting ? 'Saving...' : 'Submit Form'}</Text>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to submit this form? Please verify all information is
                  correct.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text className="text-primary-foreground">Cancel</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={handleSubmit}>
                  <Text className="text-primary-foreground">Continue</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView style={{ flex: 1, marginTop: headerHeight / 2 }} className="flex-1">
        <View className="flex-1 gap-8 p-6 pt-8">
          {renderContent()}

          {/* Success Dialog */}
          <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Success</AlertDialogTitle>
                <AlertDialogDescription>
                  Your profile has been updated successfully.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onPress={() => {
                    setShowSuccessDialog(false);
                    router.replace('/(tabs)/');
                  }}>
                  <Text className="text-primary-foreground">Ok</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Error Dialog */}
          <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Error</AlertDialogTitle>
                <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction onPress={() => setShowErrorDialog(false)}>
                  <Text className="text-primary-foreground">Ok</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Form;

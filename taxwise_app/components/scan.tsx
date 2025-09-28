import React, { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';

export default function Scan() {
  const headerHeight = useHeaderHeight();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Sorry, we need camera permissions to make this work!');
      return false;
    }
    return true;
  };

  // Take a photo using the camera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error taking photo', error.message);
    }
  };

  // Pick an image from the gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error picking image', error.message);
    }
  };

  // Process the image before sending to Google Cloud Vision API
  const processImage = async (uri) => {
    try {
      setLoading(true);
      setImage(uri);

      // Optimize image for OCR
      const manipResult = await manipulateAsync(uri, [{ resize: { width: 1000 } }], {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });

      const result = await performOCR(manipResult.uri);
      setScanResult(result);
    } catch (error) {
      Alert.alert('Error processing image', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Perform OCR using Google Cloud Vision API
  const performOCR = async (imageUri) => {
    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Replace with your Google Cloud Vision API key
      const apiKey = 'AIzaSyB_FmR2YtiIyxI53jIpVgC0eRQSNW3n6A0';
      const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      const visionResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      });

      const data = await visionResponse.json();

      if (!data.responses[0].fullTextAnnotation) {
        throw new Error('No text found in image');
      }

      const text = data.responses[0].fullTextAnnotation.text;
      return extractReceiptInfo(text);
    } catch (error) {
      throw new Error(`OCR failed: ${error.message}`);
    }
  };

  // Extract total amount and shop name from OCR text
  const extractReceiptInfo = (text) => {
    const lines = text.split('\n');
    let shopName = '';
    let total = '';

    // Usually the shop name is at the top of the receipt
    shopName = lines[0];

    // Look for total amount
    const totalRegex = /total[\s:]*[$€£]?\s*(\d+[.,]\d{2})/i;
    for (const line of lines) {
      const match = line.match(totalRegex);
      if (match) {
        total = match[1];
        break;
      }
    }

    return { shopName, total };
  };

  return (
    <SafeAreaView className="flex-1">
      <View style={{ marginTop: headerHeight / 2 }} className="flex-1 gap-8 p-6 pt-8">
        <View className="flex-row justify-center space-x-4">
          <TouchableOpacity onPress={takePhoto} className="rounded-lg bg-blue-500 px-6 py-3">
            <Text className="font-semibold text-white">Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={pickImage} className="rounded-lg bg-gray-500 px-6 py-3">
            <Text className="font-semibold text-white">Pick Image</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View className="items-center">
            <Image source={{ uri: image }} className="h-64 w-64 rounded-lg" resizeMode="contain" />
          </View>
        )}

        {loading && (
          <View className="items-center">
            <ActivityIndicator size="large" color="#0000ff" />
            <Text className="mt-2">Processing receipt...</Text>
          </View>
        )}

        {scanResult && (
          <View className="rounded-lg bg-gray-100 p-4">
            <Text className="text-lg font-semibold">Scan Results:</Text>
            <Text className="mt-2">Shop: {scanResult.shopName}</Text>
            <Text>Total: ${scanResult.total}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

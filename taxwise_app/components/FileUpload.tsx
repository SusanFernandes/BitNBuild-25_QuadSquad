import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { useUploadStatements, useAnalyzeCIBILReport } from '~/lib/api/hooks';

interface FileUploadProps {
  type: 'statements' | 'cibil';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UploadedFile {
  name: string;
  uri: string;
  size: number;
  type: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ type, onSuccess, onError }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadStatementsMutation = useUploadStatements();
  const analyzeCIBILMutation = useAnalyzeCIBILReport();

  const getAcceptedFileTypes = () => {
    if (type === 'statements') {
      return {
        mimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'],
        extensions: ['.csv', '.xlsx', '.xls', '.pdf'],
      };
    } else {
      return {
        mimeTypes: ['application/pdf'],
        extensions: ['.pdf'],
      };
    }
  };

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: getAcceptedFileTypes().mimeTypes,
        multiple: type === 'statements',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map(asset => ({
          name: asset.name,
          uri: asset.uri,
          size: asset.size || 0,
          type: asset.mimeType || 'application/octet-stream',
        }));

        setUploadedFiles(prev => [...prev, ...files]);
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick files. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) {
      Alert.alert('No Files', 'Please select files to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      let result;
      
      if (type === 'statements') {
        // Convert files to FormData format for statements
        const formData = new FormData();
        uploadedFiles.forEach((file, index) => {
          formData.append('files', {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);
        });

        result = await uploadStatementsMutation.mutateAsync(uploadedFiles);
      } else {
        // Single file for CIBIL
        const file = uploadedFiles[0];
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);

        result = await analyzeCIBILMutation.mutateAsync(formData);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadedFiles([]);
        onSuccess?.(result);
      }, 500);

    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Upload error:', error);
      onError?.(error.message || 'Upload failed. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeDescription = () => {
    if (type === 'statements') {
      return 'Upload bank statements or credit card statements (CSV, Excel, or PDF)';
    } else {
      return 'Upload your CIBIL credit report (PDF only)';
    }
  };

  const getFileFormatRequirements = () => {
    if (type === 'statements') {
      return (
        <View className="mt-4 p-4 bg-blue-50 rounded-lg">
          <Text className="text-sm font-medium text-blue-900 mb-2">File Format Requirements:</Text>
          <Text className="text-xs text-blue-800 mb-1">• CSV/Excel should have columns: Date, Description, Amount</Text>
          <Text className="text-xs text-blue-800 mb-1">• Supported formats: CSV, Excel (.xlsx, .xls), PDF</Text>
          <Text className="text-xs text-blue-800">• Date format: YYYY-MM-DD or DD/MM/YYYY</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 p-6">
      <Text className="text-xl font-bold mb-2">
        {type === 'statements' ? 'Upload Bank Statements' : 'Upload CIBIL Report'}
      </Text>
      <Text className="text-gray-600 mb-6">{getFileTypeDescription()}</Text>

      {getFileFormatRequirements()}

      <View className="mt-6">
        <Button onPress={pickFiles} disabled={isUploading} className="w-full">
        <Text>  {type === 'statements' ? 'Select Statement Files' : 'Select CIBIL Report'}</Text>
        </Button>
      </View>

      {uploadedFiles.length > 0 && (
        <View className="mt-6">
          <Text className="text-lg font-semibold mb-3">Selected Files:</Text>
          {uploadedFiles.map((file, index) => (
            <Card key={index} className="p-4 mb-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-medium" numberOfLines={1}>{file.name}</Text>
                  <Text className="text-sm text-gray-500">{formatFileSize(file.size)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeFile(index)}
                  disabled={isUploading}
                  className="ml-3"
                >
                  <Text className="text-red-500 font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          {isUploading && (
            <View className="mt-4">
              <Text className="text-sm text-gray-600 mb-2">Uploading...</Text>
              <Progress value={uploadProgress} className="h-2" />
            </View>
          )}

          <View className="mt-6">
            <Button
              onPress={uploadFiles}
              disabled={isUploading}
              className="w-full"
            >
              <Text>{isUploading ? 'Uploading...' : 'Upload & Analyze'}</Text>
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default FileUpload;

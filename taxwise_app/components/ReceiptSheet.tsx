import React from 'react';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, TouchableOpacity } from 'react-native';
import { Save } from 'lucide-react-native';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card';
import { H3, H4, Lead, Muted } from '~/components/ui/typography';
import { Text } from './ui/text';

const ReceiptBottomSheet = ({ bottomSheetRef, snapPoints, result, onSave }) => {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      index={-1}
      backgroundStyle={{ backgroundColor: '#1c1c1c' }}
      handleIndicatorStyle={{ backgroundColor: '#666' }}>
      <BottomSheetView className="flex-1 p-6">
        <Card className="gap-6">
          <CardHeader className="">
            <H3 className="text-center text-white">Receipt Details</H3>
          </CardHeader>

          <CardContent className="gap-4">
            <View className="flex-row items-center justify-between border-b border-zinc-800 pb-4">
              <Muted className="text-gray-400">Store</Muted>
              <Lead className="text-start text-white ">{result?.shopName || '-'}</Lead>
            </View>

            <View className="flex-row items-center justify-between border-b border-zinc-800 pb-4">
              <Muted className="text-gray-400">Date</Muted>
              <Muted className="text-white">{new Date().toLocaleDateString()}</Muted>
            </View>

            <View className="flex-row items-center justify-between pt-2">
              <H3 className="text-gray-400">Total Amount</H3>
              <H3 className="text-white">${result?.totalAmount?.toFixed(2) || '0.00'}</H3>
            </View>
          </CardContent>

          <CardFooter className="pt-6">
            <Button className="w-full items-center  bg-primary" onPress={onSave}>
              <Text>Save Receipt</Text>
            </Button>
          </CardFooter>
        </Card>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default ReceiptBottomSheet;

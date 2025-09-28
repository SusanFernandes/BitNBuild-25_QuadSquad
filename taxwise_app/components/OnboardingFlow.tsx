import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Animated } from 'react-native';
import { useUser } from '~/lib/contexts/UserContext';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Progress } from '~/components/ui/progress';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  component: React.ComponentType<OnboardingStepProps>;
}

interface OnboardingStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const AnimatedCard: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
};

const PersonalInfoStep: React.FC<OnboardingStepProps> = ({ data, onUpdate, onNext, isFirst, isLast }) => {
  const [formData, setFormData] = useState({
    age: data.age?.toString() || '',
    city: data.city || '',
    dependents: data.dependents?.toString() || '0',
    nri_status: data.nri_status || false,
  });

  const handleNext = () => {
    if (!formData.age || !formData.city) {
      Alert.alert('Required Fields', 'Please fill in all required fields');
      return;
    }

    onUpdate({
      age: parseInt(formData.age),
      city: formData.city,
      dependents: parseInt(formData.dependents),
      nri_status: formData.nri_status,
    });
    onNext();
  };

  return (
    <View className="flex-1 px-6 py-8">
      <AnimatedCard>
        <View className="mb-8">
          <View className="bg-blue-50 w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Text className="text-2xl">👤</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</Text>
          <Text className="text-gray-600 text-base leading-6">
            This helps us create a personalized financial plan just for you
          </Text>
        </View>
      </AnimatedCard>

      <View className="space-y-6">
        <AnimatedCard delay={100}>
          <Card className="p-5 border-0 bg-gray-50">
            <Label className="text-base font-medium text-gray-700 mb-3">Age *</Label>
            <Input
              placeholder="Enter your age"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              keyboardType="numeric"
              className="bg-white border-gray-200 text-base py-4"
            />
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <Card className="p-5 border-0 bg-gray-50">
            <Label className="text-base font-medium text-gray-700 mb-3">City *</Label>
            <Input
              placeholder="Enter your city"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              className="bg-white border-gray-200 text-base py-4"
            />
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={300}>
          <Card className="p-5 border-0 bg-gray-50">
            <Label className="text-base font-medium text-gray-700 mb-3">Number of Dependents</Label>
            <Input
              placeholder="0"
              value={formData.dependents}
              onChangeText={(text) => setFormData({ ...formData, dependents: text })}
              keyboardType="numeric"
              className="bg-white border-gray-200 text-base py-4"
            />
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={400}>
          <Card className="p-5 border-0 bg-gray-50">
            <Label className="text-base font-medium text-gray-700 mb-4">Are you an NRI?</Label>
            <RadioGroup
              value={formData.nri_status ? 'yes' : 'no'}
              onValueChange={(value) => setFormData({ ...formData, nri_status: value === 'yes' })}
              className="space-y-3"
            >
              <View className="flex-row items-center p-3 bg-white rounded-lg border border-gray-200">
                <RadioGroupItem value="no" />
                <Label className="ml-3 text-base">No, I'm an Indian resident</Label>
              </View>
              <View className="flex-row items-center p-3 bg-white rounded-lg border border-gray-200">
                <RadioGroupItem value="yes" />
                <Label className="ml-3 text-base">Yes, I'm a Non-Resident Indian</Label>
              </View>
            </RadioGroup>
          </Card>
        </AnimatedCard>
      </View>

      <View className="mt-12">
        <AnimatedCard delay={500}>
          <Button 
            onPress={handleNext} 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg"
          >
            <Text className="text-white font-semibold text-lg">Continue</Text>
          </Button>
        </AnimatedCard>
      </View>
    </View>
  );
};

const FinancialInfoStep: React.FC<OnboardingStepProps> = ({ data, onUpdate, onNext, onPrevious }) => {
  const [formData, setFormData] = useState({
    annual_income: data.annual_income?.toString() || '',
    risk_profile: data.risk_profile || 'moderate',
  });

  const handleNext = () => {
    if (!formData.annual_income) {
      Alert.alert('Required Fields', 'Please enter your annual income');
      return;
    }

    onUpdate({
      annual_income: parseFloat(formData.annual_income),
      risk_profile: formData.risk_profile,
    });
    onNext();
  };

  const riskProfiles = [
    { value: 'conservative', label: 'Conservative', desc: 'I prefer stable, low-risk investments', icon: '🛡️' },
    { value: 'moderate', label: 'Moderate', desc: 'I can handle some risk for better returns', icon: '⚖️' },
    { value: 'aggressive', label: 'Aggressive', desc: 'I\'m comfortable with high-risk investments', icon: '🚀' },
  ];

  return (
    <View className="flex-1 px-6 py-8">
      <AnimatedCard>
        <View className="mb-8">
          <View className="bg-green-50 w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Text className="text-2xl">💰</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Financial overview</Text>
          <Text className="text-gray-600 text-base leading-6">
            Help us understand your income and investment preferences
          </Text>
        </View>
      </AnimatedCard>

      <View className="space-y-6">
        <AnimatedCard delay={100}>
          <Card className="p-5 border-0 bg-gray-50">
            <Label className="text-base font-medium text-gray-700 mb-3">Annual Income (₹) *</Label>
            <Input
              placeholder="e.g., 1200000"
              value={formData.annual_income}
              onChangeText={(text) => setFormData({ ...formData, annual_income: text })}
              keyboardType="numeric"
              className="bg-white border-gray-200 text-base py-4"
            />
            <Text className="text-sm text-gray-500 mt-2">This information is kept confidential</Text>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={200}>
          <Card className="p-5 border-0 bg-gray-50">
            <Label className="text-base font-medium text-gray-700 mb-4">Investment Risk Profile</Label>
            <View className="space-y-3">
              {riskProfiles.map((profile) => (
                <View
                  key={profile.value}
                  className={`p-4 rounded-xl border-2 ${
                    formData.risk_profile === profile.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                  onTouchEnd={() => setFormData({ ...formData, risk_profile: profile.value })}
                >
                  <View className="flex-row items-center mb-2">
                    <Text className="text-xl mr-3">{profile.icon}</Text>
                    <Text className="font-semibold text-gray-900">{profile.label}</Text>
                  </View>
                  <Text className="text-gray-600 text-sm">{profile.desc}</Text>
                </View>
              ))}
            </View>
          </Card>
        </AnimatedCard>
      </View>

      <View className="mt-12 space-y-4">
        <AnimatedCard delay={300}>
          <Button 
            onPress={handleNext} 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg"
          >
            <Text className="text-white font-semibold text-lg">Continue</Text>
          </Button>
        </AnimatedCard>
        <AnimatedCard delay={400}>
          <Button 
            variant="outline" 
            onPress={onPrevious} 
            className="w-full py-4 border-2 border-gray-300 rounded-2xl"
          >
            <Text className="text-gray-700 font-medium text-lg">Previous</Text>
          </Button>
        </AnimatedCard>
      </View>
    </View>
  );
};

const InvestmentInfoStep: React.FC<OnboardingStepProps> = ({ data, onUpdate, onNext, onPrevious }) => {
  const [formData, setFormData] = useState({
    "80C": data.current_investments?.["80C"]?.toString() || '',
    "80D": data.current_investments?.["80D"]?.toString() || '',
    "80G": data.current_investments?.["80G"]?.toString() || '',
    "24b": data.current_investments?.["24b"]?.toString() || '',
  });

  const handleNext = () => {
    const investments = {
      "80C": formData["80C"] ? parseFloat(formData["80C"]) : 0,
      "80D": formData["80D"] ? parseFloat(formData["80D"]) : 0,
      "80G": formData["80G"] ? parseFloat(formData["80G"]) : 0,
      "24b": formData["24b"] ? parseFloat(formData["24b"]) : 0,
    };

    onUpdate({
      current_investments: investments,
    });
    onNext();
  };

  const investmentSections = [
    { 
      key: "80C", 
      title: "Section 80C", 
      subtitle: "PPF, ELSS, Life Insurance", 
      limit: "₹1,50,000", 
      icon: "🏛️",
      color: "bg-purple-50 border-purple-200"
    },
    { 
      key: "80D", 
      title: "Section 80D", 
      subtitle: "Health Insurance Premiums", 
      limit: "₹25,000 (₹50,000 for senior citizens)", 
      icon: "🏥",
      color: "bg-red-50 border-red-200"
    },
    { 
      key: "80G", 
      title: "Section 80G", 
      subtitle: "Charitable Donations", 
      limit: "No fixed limit", 
      icon: "❤️",
      color: "bg-pink-50 border-pink-200"
    },
    { 
      key: "24b", 
      title: "Section 24b", 
      subtitle: "Home Loan Interest", 
      limit: "₹2,00,000 for self-occupied", 
      icon: "🏠",
      color: "bg-orange-50 border-orange-200"
    },
  ];

  return (
    <View className="flex-1 px-6 py-8">
      <AnimatedCard>
        <View className="mb-8">
          <View className="bg-purple-50 w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Text className="text-2xl">📊</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Current investments</Text>
          <Text className="text-gray-600 text-base leading-6">
            Tell us about your existing tax-saving investments to avoid duplication
          </Text>
        </View>
      </AnimatedCard>

      <View className="space-y-5">
        {investmentSections.map((section, index) => (
          <AnimatedCard key={section.key} delay={100 * (index + 1)}>
            <Card className={`p-5 border-2 ${section.color}`}>
              <View className="flex-row items-center mb-3">
                <Text className="text-xl mr-3">{section.icon}</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-base">{section.title}</Text>
                  <Text className="text-gray-600 text-sm">{section.subtitle}</Text>
                </View>
              </View>
              <Input
                placeholder="₹ 0"
                value={formData[section.key]}
                onChangeText={(text) => setFormData({ ...formData, [section.key]: text })}
                keyboardType="numeric"
                className="bg-white border-gray-200 text-base py-4 mb-2"
              />
              <Text className="text-xs text-gray-500">Limit: {section.limit}</Text>
            </Card>
          </AnimatedCard>
        ))}
      </View>

      <View className="mt-12 space-y-4">
        <AnimatedCard delay={500}>
          <Button 
            onPress={handleNext} 
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg"
          >
            <Text className="text-white font-semibold text-lg">Continue</Text>
          </Button>
        </AnimatedCard>
        <AnimatedCard delay={600}>
          <Button 
            variant="outline" 
            onPress={onPrevious} 
            className="w-full py-4 border-2 border-gray-300 rounded-2xl"
          >
            <Text className="text-gray-700 font-medium text-lg">Previous</Text>
          </Button>
        </AnimatedCard>
      </View>
    </View>
  );
};

const CreditInfoStep: React.FC<OnboardingStepProps> = ({ data, onUpdate, onNext, onPrevious }) => {
  const [formData, setFormData] = useState({
    cibil_score: data.cibil_score?.toString() || '',
    credit_utilization: data.credit_utilization?.toString() || '',
    home_loan_emi: data.home_loan_emi?.toString() || '',
    outstanding_loan: data.outstanding_loan?.toString() || '',
  });

  const handleNext = () => {
    onUpdate({
      cibil_score: formData.cibil_score ? parseInt(formData.cibil_score) : undefined,
      credit_utilization: formData.credit_utilization ? parseInt(formData.credit_utilization) : undefined,
      home_loan_emi: formData.home_loan_emi ? parseFloat(formData.home_loan_emi) : undefined,
      outstanding_loan: formData.outstanding_loan ? parseFloat(formData.outstanding_loan) : undefined,
    });
    onNext();
  };

  const creditFields = [
    { 
      key: "cibil_score", 
      title: "CIBIL Score", 
      placeholder: "e.g., 750", 
      icon: "📊",
      color: "bg-blue-50 border-blue-200",
      hint: "Range: 300-900"
    },
    { 
      key: "credit_utilization", 
      title: "Credit Utilization (%)", 
      placeholder: "e.g., 30", 
      icon: "💳",
      color: "bg-green-50 border-green-200",
      hint: "Percentage of credit limit used"
    },
    { 
      key: "home_loan_emi", 
      title: "Home Loan EMI", 
      placeholder: "₹ 0", 
      icon: "🏠",
      color: "bg-orange-50 border-orange-200",
      hint: "Monthly payment amount"
    },
    { 
      key: "outstanding_loan", 
      title: "Outstanding Loan Amount", 
      placeholder: "₹ 0", 
      icon: "💰",
      color: "bg-red-50 border-red-200",
      hint: "Total remaining loan balance"
    },
  ];

  return (
    <View className="flex-1 px-6 py-8">
      <AnimatedCard>
        <View className="mb-8">
          <View className="bg-indigo-50 w-16 h-16 rounded-2xl items-center justify-center mb-4">
            <Text className="text-2xl">🎯</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">Final step!</Text>
          <Text className="text-gray-600 text-base leading-6">
            Credit information helps us provide better loan and credit card recommendations
          </Text>
          <View className="bg-yellow-50 p-4 rounded-xl mt-4 border border-yellow-200">
            <Text className="text-yellow-800 text-sm">✨ All fields are optional but recommended for personalized advice</Text>
          </View>
        </View>
      </AnimatedCard>

      <View className="space-y-5">
        {creditFields.map((field, index) => (
          <AnimatedCard key={field.key} delay={100 * (index + 1)}>
            <Card className={`p-5 border-2 ${field.color}`}>
              <View className="flex-row items-center mb-3">
                <Text className="text-xl mr-3">{field.icon}</Text>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-base">{field.title}</Text>
                  <Text className="text-gray-600 text-sm">{field.hint}</Text>
                </View>
              </View>
              <Input
                placeholder={field.placeholder}
                value={formData[field.key]}
                onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                keyboardType="numeric"
                className="bg-white border-gray-200 text-base py-4"
              />
            </Card>
          </AnimatedCard>
        ))}
      </View>

      <View className="mt-12 space-y-4">
        <AnimatedCard delay={500}>
          <Button 
            onPress={handleNext} 
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-lg"
          >
            <Text className="text-white font-semibold text-lg">🎉 Complete Setup</Text>
          </Button>
        </AnimatedCard>
        <AnimatedCard delay={600}>
          <Button 
            variant="outline" 
            onPress={onPrevious} 
            className="w-full py-4 border-2 border-gray-300 rounded-2xl"
          >
            <Text className="text-gray-700 font-medium text-lg">Previous</Text>     
          </Button>
        </AnimatedCard>
      </View>
    </View>
  );
};

const OnboardingFlow: React.FC = () => {
  const { completeOnboarding } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<any>({});

  const steps: OnboardingStep[] = [
    {
      id: 'personal',
      title: 'Personal Info',
      description: 'Basic details',
      icon: '👤',
      component: PersonalInfoStep,
    },
    {
      id: 'financial',
      title: 'Financial Info',
      description: 'Income & risk',
      icon: '💰',
      component: FinancialInfoStep,
    },
    {
      id: 'investments',
      title: 'Investments',
      description: 'Tax savings',
      icon: '📊',
      component: InvestmentInfoStep,
    },
    {
      id: 'credit',
      title: 'Credit Info',
      description: 'Score & loans',
      icon: '🎯',
      component: CreditInfoStep,
    },
  ];

  const handleUpdate = (data: any) => {
    setOnboardingData({ ...onboardingData, ...data });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding(onboardingData);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <View className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <View className="px-6 pt-12 pb-6 bg-white shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</Text>
            <Text className="text-gray-600 mt-1">{steps[currentStep].description}</Text>
          </View>
          <View className="bg-blue-50 w-12 h-12 rounded-full items-center justify-center">
            <Text className="text-xl">{steps[currentStep].icon}</Text>
          </View>
        </View>
        
        {/* Enhanced Progress Bar */}
        <View className="mt-6">
          <View className="flex-row justify-between mb-3">
            {steps.map((step, index) => (
              <View key={step.id} className="flex-1 items-center">
                <View 
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    index <= currentStep 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200'
                  }`}
                >
                  <Text className={`text-xs font-bold ${
                    index <= currentStep ? 'text-white' : 'text-gray-500'
                  }`}>
                    {index + 1}
                  </Text>
                </View>
                {index < steps.length - 1 && (
                  <View 
                    className={`absolute top-4 left-1/2 w-full h-0.5 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} 
                    style={{ transform: [{ translateX: 16 }] }}
                  />
                )}
              </View>
            ))}
          </View>
          <Progress value={progress} className="h-3 bg-gray-100" />
          <Text className="text-sm text-gray-600 text-center mt-3 font-medium">
            Step {currentStep + 1} of {steps.length} • {Math.round(progress)}% complete
          </Text>
        </View>
      </View>

      {/* Content Area */}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <CurrentStepComponent
          data={onboardingData}
          onUpdate={handleUpdate}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
        />
      </ScrollView>
    </View>
  );
};

export default OnboardingFlow;
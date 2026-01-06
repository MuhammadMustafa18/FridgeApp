import { Ionicons } from "@expo/vector-icons";
import { Tabs } from 'expo-router';
import React from 'react';
import { Image, View } from "react-native";

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#CCC",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 10,
          backgroundColor: "white",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? "home" : "home-outline"} color={color} />
          ),
        }}
      />
      {/* Scan (CENTER BUTTON) */}
      <Tabs.Screen
        name="scan" // cant remove this, used for id
        options={{
          tabBarLabel: () => null, // 👈 no text
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 32,
                backgroundColor: "#47de4cff",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: -10, // lifts it up
              }}
            >
              <Image
                source={require('../../assets/images/iconmiddle.png')}
                style={{ width: 33, height: 33, tintColor: 'white' }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={22} name={focused ? "cube" : "cube-outline"} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

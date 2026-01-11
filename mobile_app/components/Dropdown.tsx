import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { styled } from 'nativewind';

interface Option {
    label: string;
    value: string;
}

interface DropdownProps {
    label: string;
    options: Option[];
    value: string;
    onSelect: (value: string) => void;
    placeholder?: string;
}

export default function Dropdown({ label, options, value, onSelect, placeholder }: DropdownProps) {
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find(o => o.value === value);

    return (
        <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
            <TouchableOpacity
                className="w-full border border-gray-300 rounded-lg p-3 bg-white"
                onPress={() => setVisible(true)}
            >
                <Text className={selectedOption ? "text-gray-900" : "text-gray-400"}>
                    {selectedOption ? selectedOption.label : placeholder || 'Select...'}
                </Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-xl max-h-[70%]">
                        <View className="p-4 border-b border-gray-200 flex-row justify-between items-center bg-gray-50 rounded-t-xl">
                            <Text className="font-bold text-lg text-gray-800">{label}</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Text className="text-blue-600 font-medium">Close</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className={`p-4 border-b border-gray-100 ${item.value === value ? 'bg-blue-50' : ''}`}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setVisible(false);
                                    }}
                                >
                                    <Text className={`text-base ${item.value === value ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

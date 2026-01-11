import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { SidebarContent } from '../../components/Sidebar';

export default function DrawerLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <SidebarContent {...props} />}
                screenOptions={{
                    headerShown: false,
                    drawerType: 'front',
                    drawerStyle: { width: '80%' },
                    overlayColor: 'rgba(0,0,0,0.5)',
                }}
            >
                <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
                <Drawer.Screen name="transactions" options={{ title: 'Transactions' }} />
                <Drawer.Screen name="payments" options={{ title: 'Payments' }} />
                <Drawer.Screen name="contacts" options={{ title: 'Contacts' }} />
                <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
            </Drawer>
        </GestureHandlerRootView>
    );
}

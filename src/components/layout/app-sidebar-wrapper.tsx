import { AppSidebar } from "./app-sidebar";
import { getCurrentUser } from "@/server/actions/user-actions";

export async function AppSidebarWrapper(props: Omit<React.ComponentProps<typeof AppSidebar>, 'user'>) {
    const user = await getCurrentUser();

    return <AppSidebar {...props} user={user} />;
}

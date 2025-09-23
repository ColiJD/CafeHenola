import ProtectedPage from "@/components/ProtectedPage";
import Menu from "@/app/page/menu/page";
export default function Home() {
  return (
    <ProtectedPage allowedRoles={["ADMIN"]}>
      <main>
        <Menu />
      </main>
    </ProtectedPage>
  );
}

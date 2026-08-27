import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoutes';
import Login from './SuperAdmin/pages/Login/Login';
import Sidebar from './components/Sidebar';
import { AlertContainer, showToast } from './components/AlertBox';
import BookingForm from './components/BookingForm';
import PublicTrackingPage from './components/PublicTrackingPage';
import AdminBookingDetails from './components/AdminBookingDetails';

// Dashboard
import Dashboard from './SuperAdmin/pages/Dashboard/Dashboard';

// Master
import AddTax from './pages/Taxes/AddTax';
import TaxList from './pages/Taxes/TaxList';
import AddPickupCity from './SuperAdmin/pages/Master/PickupCity/AddPickupCity';
import ListPickupCity from './SuperAdmin/pages/Master/PickupCity/ListPickupCity';
import PickupAreaAdd from './SuperAdmin/pages/Master/PickupArea/PickupAreaAdd';
import PickupAreaInfo from './SuperAdmin/pages/Master/PickupArea/PickupAreaInfo';
import AddCompany from './SuperAdmin/pages/Master/Company/AddCompany';
import ListCompany from './SuperAdmin/pages/Master/Company/ListCompany';
import EditCompany from './SuperAdmin/pages/Master/Company/EditCompany';
import AddPackage from './SuperAdmin/pages/Master/Package/AddPackage';
import ListPackage from './SuperAdmin/pages/Master/Package/ListPackage';

// Configuration
import Configuration from './SuperAdmin/pages/Configuration/Configuration';
import EmailConfiguration from './SuperAdmin/pages/Configuration/EmailConfiguration';
import EditEmail from './SuperAdmin/pages/Configuration/EditEmail';
import EditMainTemplate from './SuperAdmin/pages/Configuration/EditMainTemplate';

// Payment Mode
import AddPaymentMode from './SuperAdmin/pages/PaymentMode/AddPaymentMode';
import ListPaymentMode from './SuperAdmin/pages/PaymentMode/ListPaymentMode';

// Vehicle
import AddVehicleMaster from './SuperAdmin/pages/Vehicle/VehicleMaster/AddVehicleMaster';
import ListVehicleMaster from './SuperAdmin/pages/Vehicle/VehicleMaster/ListVehicleMaster';

// Orders
import ConfirmPendingList from './SuperAdmin/pages/Orders/ConfirmPendingList';
import ViewConfirmPendingOrder from './SuperAdmin/pages/Orders/view/viewConfrimPendingList';
import EditConfirmPendingList from './SuperAdmin/pages/Orders/Edit/editConfirmPendingList';
import ClosePendingList from './SuperAdmin/pages/Orders/ClosePendingList';
import ViewClosePendingOrder from './SuperAdmin/pages/Orders/view/viewClosePendingList';
import ClosePendingOrderDetails from './SuperAdmin/pages/Orders/close/closePendingList';
import EditClosePendingOrder from './SuperAdmin/pages/Orders/Edit/editClosePendingList';
import PaymentPendingList from './SuperAdmin/pages/Orders/PaymentPendingList';
import ViewPaymentPendingList from './SuperAdmin/pages/Orders/view/viewPaymentPendingList';
import CompletedList from './SuperAdmin/pages/Orders/CompletedList';
import OrderPaymentList from './SuperAdmin/pages/Orders/PaymentList';
import ViewPaymentList from './SuperAdmin/pages/Orders/view/viewPaymentList';
import ListCancelOrder from './SuperAdmin/pages/Orders/ListCancelOrder';

// Users
import UserList from './SuperAdmin/pages/Users/UserList';
import CreateInvoice from './SuperAdmin/pages/Users/Createinvoice';
import UserDetails from './SuperAdmin/pages/Users/UserDetails';

// Owners
import AddVendor from './SuperAdmin/pages/Vendors/AddVendor';
import ListVendor from './SuperAdmin/pages/Vendors/ListVendor';

// Drivers
import AddDriver from './SuperAdmin/pages/Drivers/AddDriver';
import ListDriver from './SuperAdmin/pages/Drivers/ListDriver';
import AssignedList from './SuperAdmin/pages/Drivers/ListAssignedTask';
import TripDetails from './SuperAdmin/pages/Drivers/TripDetails';
import DriverTripDetail from './SuperAdmin/pages/Drivers/DriverTripDetail';

// Invoice
import PendingInvoices from './SuperAdmin/pages/Invoice/PendingInvoices';
import InvoiceReminder from './SuperAdmin/pages/Invoice/InvoiceReminder';
import PaymentForInvoices from './SuperAdmin/pages/Invoice/PaymentForInvoices';
import PaidInvoiceList from './SuperAdmin/pages/Invoice/PaidInvoiceList';
import AllInvoiceList from './SuperAdmin/pages/Invoice/AllInvoiceList';
import InvoicePayHolder from './SuperAdmin/pages/Invoice/InvoicePayHolder';

// Reports
import OrderSummary from './SuperAdmin/pages/Reports/OrderSummary';
import CompanyOrderSummary from './SuperAdmin/pages/Reports/CompanyOrderSummary';
import OverallInvoiceReport from './SuperAdmin/pages/Reports/OverallInvoiceReport';

// Cache
import Cache from './SuperAdmin/pages/Cache/Cache';
import Header from './components/Header';
import AddUser from './SuperAdmin/pages/Users/AddUser';
import ViewCancelOrder from './SuperAdmin/pages/Orders/view/viewListCancelOrder';
import ViewCompletedList from './SuperAdmin/pages/Orders/view/viewCompletedLis';
import PaymentSuccess from './SuperAdmin/pages/Invoice/PaymentSuccess';
import UserInvoiceDetails from './SuperAdmin/pages/Invoice/UserInvoiceDetails';
import UserInvoice from './SuperAdmin/pages/Users/UserInvoice';
import UserAccount from './SuperAdmin/pages/Users/UserAccount';
import UserLogin from './SuperAdmin/pages/Users/UserLogin';
import VehicleDetails from './SuperAdmin/pages/Users/UserVehicleDetails';
import UserAddressEditForm from './SuperAdmin/pages/Users/UserEditAddress';
import ConfirmPendingOrders from './SuperAdmin/pages/Users/List/ConfirmPending';
import PaymentPendingOrders from './SuperAdmin/pages/Users/List/PaymentPending';
import ClosePendingOrders from './SuperAdmin/pages/Users/List/ClosePending';
import CompletedOrders from './SuperAdmin/pages/Users/List/CompletedOrder';
import ViewConfirmPendingOrderList from './SuperAdmin/pages/Users/viewdetails/viewConfrimPendingList';
import ViewPaymentPending from './SuperAdmin/pages/Users/viewdetails/viewPaymentPendingList';
import ViewClosePendingOrderList from './SuperAdmin/pages/Users/viewdetails/viewClosePendingList';
import UserViewConfirmPendingOrder from './SuperAdmin/pages/Users/viewdetails/viewConfrimPendingList';
import UserViewClosePendingOrderList from './SuperAdmin/pages/Users/viewdetails/viewClosePendingList';
import UserViewPaymentPending from './SuperAdmin/pages/Users/viewdetails/viewPaymentPendingList';
import UserViewPaymentList from './SuperAdmin/pages/Users/viewdetails/viewPaymentList';
import UserViewCancelOrder from './SuperAdmin/pages/Users/viewdetails/viewListCancelOrder';
import UserViewCompletedList from './SuperAdmin/pages/Users/viewdetails/viewCompletedLis';
import MyAccount from './SuperAdmin/pages/Users/MyAccount';
import HowItWorks from './SuperAdmin/pages/Users/HowItWorks';
import MyorderDetails from './SuperAdmin/pages/Users/BookingHistory/MyorderDetails';
import MycancelorderDetails from './SuperAdmin/pages/Users/BookingHistory/MycancelorderDetails';
import MypaymentHistory from './SuperAdmin/pages/Users/BookingHistory/MypaymentHistory';
import MyPendingInvoices from './SuperAdmin/pages/Users/BookingHistory/MypendingInvoices';
import MyInvoices from './SuperAdmin/pages/Users/BookingHistory/MyInvoices';
import ManagerUserList from './SuperAdmin/pages/Users/List/ManagerUserList';
import UserViewDetails from './SuperAdmin/pages/Users/List/UserViewDetails';
import ForgotPassword from './SuperAdmin/pages/Login/ForgetPasword';
import CompanyHeader from './SuperAdmin/pages/Users/List/CompanyHeader';
import ManagerAddUser from './SuperAdmin/pages/Users/ManagerAddUser';
import PaymentReturn from './SuperAdmin/pages/Payment/PaymentReturn';
import TravelHeader from './SuperAdmin/pages/Users/header';
// import TermsAndConditions from './SuperAdmin/pages/Homepage/Selections/TermsAndConditions';
// import PrivacyPolicy from './SuperAdmin/pages/Homepage/Selections/PrivacyPolicy';
// import CancelReservation from './SuperAdmin/pages/Homepage/Selections/CancelReservation';
// import SimpleHeader from './SuperAdmin/pages/Homepage/Selections/simpleheader';
import HomePage from './components/Homepage/homepage';
import TermsAndConditions from './components/Homepage/TermsAndConditions';
import PrivacyPolicy from './components/Homepage/PrivacyPolicy';
import CancelReservation from './components/Homepage/CancelReservation';
import SimpleHeader from './components/Homepage/simpleheader';
import PartnerRegistrationForm from './components/Homepage/fromdata';
import Monthlybooking from './SuperAdmin/pages/Users/Bookings/monthlybooking';
import MonthlyReport from './SuperAdmin/pages/Users/Bookings/monthlyreport';
import PaymentForMonthlyInvoices from './SuperAdmin/pages/Invoice/PaymentForMonthlyInvoices';
import UploadUsers from './SuperAdmin/pages/uploadfile/uploadfile';
import Oncallinvoice from './SuperAdmin/pages/Users/Bookings/oncallbooking';
import OnCallInvoiceView from './SuperAdmin/pages/Orders/view/Oncallinvoiceview';

// ── NEW COMMERCIAL PAGES ────────────────────────────────────────────────────
import BookingList from './pages/Bookings/BookingList';
import CustomerList from './pages/Customers/CustomerList';
import CustomerDetails from './pages/Customers/CustomerDetails';
import AddCustomer from './pages/Customers/AddCustomer';
import OrgUserList from './pages/Organizations/OrgUserList';
import AddOrgUser from './pages/Organizations/AddOrgUser';
import OrganizationDetails from './pages/Organizations/OrganizationDetails';
import ContractList from './pages/Contracts/ContractList';
import AddContract from './pages/Contracts/AddContract';
import ContractDetails from './pages/Contracts/ContractDetails';
import ContractBookings from './pages/Contracts/ContractBookings';
import ScheduleList from './pages/Schedules/ScheduleList';
import AddSchedule from './pages/Schedules/AddSchedule';
import InvoiceList from './pages/Invoices/InvoiceList';
import PaymentList from './pages/Payments/PaymentList';
import AddPayment from './pages/Payments/AddPayment';
import Reports from './pages/Reports/Reports';

// ── CUSTOMER PAGES ──────────────────────────────────────────────────────────
import RegisterPage from './pages/Auth/Register';
import CustomerLoginPage from './pages/Auth/Login';
import CustomerDashboard from './pages/Customer/Dashboard';
import CustomerBookingsList from './pages/Customer/BookingsList';
import CustomerBookingDetails from './pages/Customer/BookingDetails';
import CustomerTrackRide from './pages/Customer/TrackRide';
import CustomerPayments from './pages/Customer/Payments';
import CustomerProfile from './pages/Customer/Profile';
import CustomerInvoices from './pages/Customer/Invoices';
import CustomerInvoiceDetails from './pages/Customer/InvoiceDetails';
import MonthlyBillingList from './pages/MonthlyBilling/MonthlyBillingList';
import OrgDashboard from './pages/Customer/OrgDashboard';
import ListTax from './SuperAdmin/pages/Master/Tax/ListTax';

const Layout = () => {
  const role = localStorage.getItem("role");
  const location = useLocation();

  const adminPaths = [
    "/admin/dashboard",
    "/admin/book",
    "/bookings",
    "/fleet",
    "/organizations",
    "/customers",
    "/packages",
    "/contracts",
    "/schedules",
    "/invoices",
    "/payments",
    "/reports",
    "/admin/monthly-billing",
    "/master/tax",
    "/master/pickupcity",
    "/master/company",
    "/master/package",
    "/configuration/email",
    "/paymentmode",
    "/vehicle/vehiclemaster",
    "/orders/confirmpending",
    "/orders/closepending",
    "/orders/paymentpending",
    "/orders/completed",
    "/orders/paymentlist",
    "/orders/cancelled",
    "/users/list",
    "/vendors"
  ];

  const isAdminPath = adminPaths.some(path => location.pathname.startsWith(path));

  // Protect Admin / Operator routes from customers, drivers and managers
  if (isAdminPath && role !== "superadmin" && role !== "admin" && role !== "accountant") {
    showToast("403 Unauthorized: Access to administrative pages is restricted.", "error");
    if (role === "customer") {
      return <Navigate to="/customer/dashboard" replace />;
    } else if (role === "driver") {
      return <Navigate to="/drivers/assignedlist" replace />;
    } else if (role === "manager") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // Protect Admin / Operator routes from customers (fallback for non-explicitly listed admin routes)
  const publicRoutes = ["/", "/login", "/register", "/track-booking", "/forgetpasword", "/TermsAndConditions", "/PrivacyPolicy", "/CancelReservation", "/fromdata"];
  if (role === "customer" && !location.pathname.startsWith("/customer") && !publicRoutes.includes(location.pathname)) {
    showToast("403 Unauthorized: Customers cannot access administrative pages.", "error");
    return <Navigate to="/customer/dashboard" replace />;
  }

  // Protect Customer routes from admins / operators
  if (role && role !== "customer" && location.pathname.startsWith("/customer")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {role && <Sidebar />}

      <AlertContainer />
      <main
        className={`flex-1 bg-gray-100 p-2 overflow-auto ${role ? "ml-64" : ""
          }`}
      >

        {role === "manager" ? <TravelHeader /> : <Header />}

        <Routes>
          <Route path="/dashboard" element={role === "manager" ? <OrgDashboard /> : <Dashboard />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/" element={role === "manager" ? <OrgDashboard /> : <Dashboard />} />
          {/* Master Routes */}
          <Route path="/master/tax/add" element={<AddTax />} />
          <Route path="/master/tax/list" element={<ListTax />} />
          <Route path="/master/pickupcity/add" element={<AddPickupCity />} />
          <Route path="/master/pickupcity/list" element={<ListPickupCity />} />
          <Route path="/master/pickuparea/add" element={<PickupAreaAdd />} />
          <Route path="/master/pickuparea/info" element={<PickupAreaInfo />} />
          <Route path="/master/company/add" element={<AddCompany />} />
          <Route path="/master/company/list" element={<ListCompany />} />
          <Route path="/company/edit/:companyId" element={<EditCompany />} />
          <Route path="/master/package/add" element={<AddPackage />} />
          <Route path="/master/package/list" element={<ListPackage />} />
          {/* Configuration Routes */}
          <Route path="/configuration/master" element={<Configuration />} />
          <Route path="/configuration/email" element={<EmailConfiguration />} />
          <Route path="/email/configurations/edit/:id" element={<EditEmail />} />
          <Route path="/email/configurations/edit-main-template" element={<EditMainTemplate />} />
          {/* Payment Mode Routes */}
          <Route path="/paymentmode/add" element={<AddPaymentMode />} />
          <Route path="/paymentmode/list" element={<ListPaymentMode />} />
          {/* Vehicle Routes */}
          <Route path="/vehicle/vehiclemaster/add" element={<AddVehicleMaster />} />
          <Route path="/vehicle/vehiclemaster/list" element={<ListVehicleMaster />} />
          {/* Orders Routes */}
          <Route path="/orders/confirmpending" element={<ConfirmPendingList />} />
          <Route path="/orders/view/confirm-pending-order/:bookingId" element={<ViewConfirmPendingOrder />} />
          <Route path="/orders/confirmpending/:bookingId" element={<EditConfirmPendingList />} />
          <Route path="/orders/closepending" element={<ClosePendingList />} />
          <Route path="/orders/view/close-pending-order/:bookingId" element={<ViewClosePendingOrder />} />
          {/* <Route path="/orders/close/close-pending-order/:bookingId" element={<ClosePendingOrderDetails />} /> */}
          <Route path="/orders/close/close-pending-order/:bookingCode" element={<ClosePendingOrderDetails />} />
          <Route path="/orders/edit/close-pending-order/:bookingId" element={<EditClosePendingOrder />} />
          <Route path="/orders/paymentpending" element={<PaymentPendingList />} />
          <Route path="/orders/view/payment-pending-order/:bookingId" element={<ViewPaymentPendingList />} />
          <Route path="/orders/view/completed-list/:bookingId" element={<ViewCompletedList />} />
          <Route path="/orders/oncall-invoice/:onCallBillId" element={<OnCallInvoiceView />} />
          <Route path="/orders/completed" element={<CompletedList />} />
          <Route path="/orders/paymentlist" element={<OrderPaymentList />} />
          <Route path="/orders/view/payment-list/:paymentId" element={<ViewPaymentList />} />
          <Route path="/orders/cancelled" element={<ListCancelOrder />} />
          <Route path="/orders/view/cancelled-order/:bookingId" element={<ViewCancelOrder />} />
          {/* Users Routes */}
          <Route path="/users/adduser" element={<AddUser />} />
          <Route path="/users/list" element={<UserList />} />

          <Route path="/users/userdetails/:userId" element={<UserDetails />} />
          {/* Booking  */}
          <Route path="/booking/create" element={<BookingForm mode="admin" />} />
          <Route path="/booking/monthlybooking" element={<Monthlybooking />} />
          <Route path="/booking/monthlyreport" element={<MonthlyReport />} />
          <Route path="/booking/oncallinvoice" element={<Oncallinvoice />} />

          <Route
            path="/booking/oncallinvoice/edit/:onCallBillId"
            element={<Oncallinvoice />}
          />
          {/* Owners Routes */}
          <Route path="/vendors/add" element={<AddVendor />} />
          <Route path="/vendors/list" element={<ListVendor />} />
          {/* Drivers Routes */}
          <Route path="/drivers/add" element={<AddDriver />} />
          <Route path="/drivers/list" element={<ListDriver />} />
          <Route path="/drivers/assignedlist" element={<AssignedList />} />
          <Route path="/drivers/tripdetails" element={<TripDetails />} />
          <Route path="/drivers/trip-details/:bookingId" element={<DriverTripDetail />} />
          {/* Invoice Routes */}
          <Route path="/invoice/pending" element={<PendingInvoices />} />
          <Route path="/invoice/reminder" element={<InvoiceReminder />} />
          <Route path="/invoice/paymentfor" element={<PaymentForInvoices />} />
          <Route path="/invoice/paymentformonthly" element={<PaymentForMonthlyInvoices />} />
          <Route path="/invoice/paid" element={<PaidInvoiceList />} />
          <Route path="/invoice/all" element={<AllInvoiceList />} />
          <Route path="/invoice/payholder" element={<InvoicePayHolder />} />
          <Route path="/paymentsuccess" element={<PaymentSuccess />} />
          {/* Reports Routes */}
          <Route path="/reports/order-summary" element={<OrderSummary />} />
          <Route path="/reports/company-order-summary" element={<CompanyOrderSummary />} />
          <Route path="/reports/overall-invoice-report" element={<OverallInvoiceReport />} />
          {/* Cache Route */}
          <Route path="/cache" element={<Cache />} />
          <Route path="/uploads" element={<UploadUsers />} />
          {/* Fallback Route */}
          <Route path="*" element={<div className="text-xl">Welcome! Select a menu item.</div>} />

          {/* ══ NEW COMMERCIAL ROUTES ══════════════════════════════════════════ */}

          {/* Bookings (unified) */}
          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/:id" element={<AdminBookingDetails />} />
          <Route path="/admin/book" element={<BookingForm mode="admin" />} />
          <Route path="/bookings/add" element={<BookingForm mode="admin" />} />

          {/* Fleet — aliased to existing vehicle/driver pages */}
          <Route path="/fleet/vehicles" element={<ListVehicleMaster />} />
          <Route path="/fleet/vehicles/add" element={<AddVehicleMaster />} />
          <Route path="/fleet/drivers" element={<ListDriver />} />
          <Route path="/fleet/drivers/add" element={<AddDriver />} />
          <Route path="/fleet/drivers/edit/:id" element={<ListDriver />} />

          {/* Organizations — existing pages */}
          <Route path="/organizations" element={<ListCompany />} />
          <Route path="/organizations/add" element={<AddCompany />} />
          <Route path="/organizations/:id" element={<OrganizationDetails />} />

          {/* Organization Users — new pages */}
          <Route path="/organizations/users" element={<OrgUserList />} />
          <Route path="/organizations/users/add" element={<AddOrgUser />} />

          {/* Taxes */}
          <Route path="/taxes" element={<TaxList />} />
          <Route path="/taxes/add" element={<AddTax />} />

          {/* Customers — new pages */}
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetails />} />
          <Route path="/customers/add" element={<AddCustomer />} />

          {/* Packages — existing pages */}
          <Route path="/packages" element={<ListPackage />} />
          <Route path="/packages/add" element={<AddPackage />} />

          {/* Contracts — new pages */}
          <Route path="/contracts" element={<ContractList />} />
          <Route path="/contracts/add" element={<AddContract />} />
          <Route path="/contracts/bookings" element={<ContractBookings />} />
          <Route path="/contracts/:id" element={<ContractDetails />} />
          <Route path="/admin/monthly-billing" element={<MonthlyBillingList />} />
          <Route path="/organization/dashboard" element={<OrgDashboard />} />

          {/* Schedules — new pages */}
          <Route path="/schedules" element={<ScheduleList />} />
          <Route path="/schedules/add" element={<AddSchedule />} />

          {/* Invoices — new unified page */}
          <Route path="/invoices" element={<InvoiceList />} />

          {/* Payments — new pages */}
          <Route path="/payments" element={<PaymentList />} />
          <Route path="/payments/add" element={<AddPayment />} />

          {/* Reports — new unified page */}
          <Route path="/reports" element={<Reports />} />

          {/* Customer Routes */}
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/book" element={<BookingForm mode="customer" />} />
          <Route path="/customer/bookings" element={<CustomerBookingsList />} />
          <Route path="/customer/bookings/:bookingId" element={<CustomerBookingDetails />} />
          <Route path="/customer/track" element={<CustomerTrackRide />} />
          <Route path="/customer/track/:bookingId" element={<CustomerTrackRide />} />
          <Route path="/customer/invoices" element={<CustomerInvoices />} />
          <Route path="/customer/invoices/:id" element={<CustomerInvoiceDetails />} />
          <Route path="/customer/payments" element={<CustomerPayments />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />

        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (

    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/adminlogin" element={<Login />} />
          {/* <Route path="/admin/login" element={<Login />} /> */}
          <Route path="/login" element={<CustomerLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgetpasword" element={<ForgotPassword />} />
          <Route path="/track-booking" element={<PublicTrackingPage />} />

          <Route path="/managerusers/list/:id" element={<ManagerUserList />} />
          <Route path="/users/userviewdetails/:userId" element={<UserViewDetails />} />
          <Route path="/Company/:seoUrl" element={<UserLogin />} />

          <Route path="/*" element={<PrivateRoute><Layout /></PrivateRoute>} />
          <Route path="/invoice/user-invoice-details/:userId" element={<UserInvoiceDetails />} />
          <Route path="/users/userinvoice/:id" element={<UserInvoice />} />
          <Route path="/users/createinvoice/:id" element={<CreateInvoice />} />

          <Route path="/users/useraccount/:id" element={<UserAccount />} />
          <Route path="/users/uservehicledetails/:id" element={<VehicleDetails />} />
          <Route path="/Users/UserEditAddressForm/:id" element={<UserAddressEditForm />} />
          <Route path="/user/confirm-pending" element={<ConfirmPendingOrders />} />
          <Route path="/user/payment-pending" element={<PaymentPendingOrders />} />
          <Route path="/user/close-pending" element={<ClosePendingOrders />} />
          <Route path="/user/completed" element={<CompletedOrders />} />
          <Route path="/users/view/confirm-pending-orderlist/:bookingId" element={<UserViewConfirmPendingOrder />} />

          <Route path="/users/view/close-pending-orderlist/:bookingId" element={<UserViewClosePendingOrderList />} />

          <Route path="/users/view/payment-pending-orderlist/:bookingId" element={< UserViewPaymentPending />} />
          <Route path="/users/view/payment-list/:bookingId" element={<UserViewPaymentList />} />

          <Route path="/users/view/cancelled-order/:bookingId" element={<UserViewCancelOrder />} />

          <Route path="/users/view/completed-lists/:bookingId" element={<UserViewCompletedList />} />

          <Route path="/users/myaccount" element={<MyAccount />} />

          <Route path="/user/howitworks" element={<HowItWorks />} />

          <Route path="/company/:seoUrl/managerAddUser" element={<ManagerAddUser />} />


          <Route path="/Users/BookingHistory/MyorderDetails/:id" element={<MyorderDetails />} />
          <Route path="/Users/BookingHistory/MycancelorderDetails/:id" element={<MycancelorderDetails />} />
          <Route path="/Users/BookingHistory/MypaymentHistory/:id" element={<MypaymentHistory />} />
          <Route path="/Users/BookingHistory/MypendingInvoices/:id" element={<MyPendingInvoices />} />
          <Route path="/Users/BookingHistory/MyInvoices/:id" element={<MyInvoices />} />
          <Route path="/payments/return" element={<PaymentReturn />} />
          {/* <Route path="/TermsAndConditions" element={<TermsAndConditions/>} />
  <Route path="/PrivacyPolicy" element={<PrivacyPolicy/>} />
  <Route path="/CancelReservation" element={<CancelReservation/>}/> */}
          {/* <Route path="/simpleheader" element={<SimpleHeader/>}/> */}
          <Route path="/TermsAndConditions" element={<TermsAndConditions />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/CancelReservation" element={<CancelReservation />} />
          <Route path="/simpleheader" element={<SimpleHeader />} />
          <Route path="/fromdata" element={<PartnerRegistrationForm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
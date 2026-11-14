import Swal from 'sweetalert2';

export const toastSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: 'เยี่ยมเลย!',
    customClass: {
      popup: 'kidquest-swal',
      confirmButton: 'kidquest-swal-confirm',
    },
    buttonsStyling: false,
  });
};

export const toastEncouragement = (title: string, text: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: 'ตกลง',
    customClass: {
      popup: 'kidquest-swal',
      confirmButton: 'kidquest-swal-confirm',
    },
    buttonsStyling: false,
  });
};

export const toastError = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'เข้าใจแล้ว',
    customClass: {
      popup: 'kidquest-swal',
      confirmButton: 'kidquest-swal-confirm',
    },
    buttonsStyling: false,
  });
};

package com.skyfreight.portal.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserUpdateRequest {

    @Email
    @Size(max = 150)
    private String email;

    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    @Size(max = 150)
    private String company;

    @Size(max = 20)
    private String phone;
}

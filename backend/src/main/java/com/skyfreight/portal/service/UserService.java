package com.skyfreight.portal.service;

import com.skyfreight.portal.dto.request.UserUpdateRequest;
import com.skyfreight.portal.dto.response.UserResponse;
import com.skyfreight.portal.entity.Role;
import com.skyfreight.portal.entity.User;
import com.skyfreight.portal.exception.UserNotFoundException;
import com.skyfreight.portal.repository.RoleRepository;
import com.skyfreight.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(User.UserStatus status, User.AccountType accountType,
                                      String search, Pageable pageable) {
        return userRepository.findAllWithFilters(status, accountType, search, pageable)
                .map(UserResponse::from);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));

        if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email address is already in use");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getCompany() != null) user.setCompany(request.getCompany());
        if (request.getPhone() != null) user.setPhone(request.getPhone());

        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateStatus(Long id, User.UserStatus newStatus) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        user.setStatus(newStatus);
        log.info("User {} status changed to {}", user.getEmail(), newStatus);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse assignRole(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId));
        user.getRoles().add(role);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional
    public UserResponse revokeRole(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.getRoles().removeIf(r -> r.getId().equals(roleId));
        return UserResponse.from(userRepository.save(user));
    }
}

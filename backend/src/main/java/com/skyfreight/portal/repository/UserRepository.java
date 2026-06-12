package com.skyfreight.portal.repository;

import com.skyfreight.portal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            SELECT u FROM User u
            WHERE (:status IS NULL OR u.status = :status)
              AND (:accountType IS NULL OR u.accountType = :accountType)
              AND (:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(u.lastName) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%'))
                   OR LOWER(u.company) LIKE LOWER(CONCAT('%',:search,'%')))
            """)
    Page<User> findAllWithFilters(
            @Param("status") User.UserStatus status,
            @Param("accountType") User.AccountType accountType,
            @Param("search") String search,
            Pageable pageable);
}

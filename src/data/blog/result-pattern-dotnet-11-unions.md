---
title: "A Better Result Pattern With Closed Class Heirarchies and C# 15 Unions"
author: "Adam Shirt"
pubDatetime: 2026-06-26T15:00:00Z
modDatetime: 2026-06-26T15:00:00Z
slug: a-better-result-pattern-with-closed-class-heirarchies-and-csharp-15-unions
featured: false
draft: false
tags:
  - csharp
  - design patterns
  - dotnet
description: "A detailed review into union types, closed class heirarchies and the result pattern in C#."
---

## Table of Contents

## What is the Result Pattern?

The result pattern is a pattern where a method returns an immutable instance that represents either a successful or a non-successful result. It comes from functional programming and has gained popularity as a way to write explicit, predictable, more maintainable code.

## Use-Cases

Situations where the result pattern really shines is when failure is an expected outcome, or when outcomes are not binary. For example:

- Enforcing domain/business rules
- Modelling a command and result, especially one triggered by a user
- Chains of operations where one or more steps can fail
- User-input validation

Especially when writing web APIs, I'll lean on the result pattern heavily. It pairs naturally with CQRS and makes logic and error handling explicit.

## The Status Quo

### Inheritance-based Results

Typically when implementing the result pattern in C#, I'll take an inheritance-based approach.

```csharp
abstract record ApplyDiscountCodeResult
{
    private ApplyDiscountCodeResult() {}

    public sealed record CodeNotFound : ApplyDiscountCodeResult
    {
        public static readonly CodeNotFound Instance = new();
    }
    public sealed record CodeExpired(DateTime ExpiredAtUtc) : ApplyDiscountCodeResult;
    public sealed record Success(double DiscountPercentage, decimal DiscountedPrice) : ApplyDiscountCodeResult;
}
```

```csharp
ApplyDiscountCodeResult ApplyDiscount(string code, decimal originalPrice)
{
    if (!discountCodes.TryGetValue(code.ToUpperInvariant(), out var discount))
        return ApplyDiscountCodeResult.CodeNotFound.Instance;
    if (discount.ExpiresAtUtc < DateTime.UtcNow)
        return new ApplyDiscountCodeResult.CodeExpired(discount.ExpiresAtUtc);

    var discountedPrice = Math.Round(originalPrice * (1 - (decimal)discount.Percentage / 100), 2);
    return new ApplyDiscountCodeResult.Success(discount.Percentage, discountedPrice);
}
```

Where you can then pattern match to unwrap the result.

> [!NOTE]
> Here the default switch case throws an `UnreachableException`, as the compiler warns that the switch expression is not exhaustive - more on this further on in the article.

```csharp
var result = ApplyDiscount("SUMMER10", 100.00m);
return result switch
{
    ApplyDiscountCodeResult.CodeNotFound => MapNotFoundResult(),
    ApplyDiscountCodeResult.CodeExpired expired => MapExpiredResult(expired.ExpiredAtUtc),
    ApplyDiscountCodeResult.Success success => MapSuccessResult(success.DiscountPercentage, success.DiscountedPrice),
    _ => throw new UnreachableException()
};
```

This has served me well over the past few years and is what I've settled on after evaluating other approaches. My main arguments as to why this approach works well:

1. Flexibility - you can have one or more success results and one or more non-successful results, in whatever shape you choose.
2. Extensibility - it follows the open-close principle in that you can extend with new result types, without modifying the existing code.
3. Expressiveness - critisism of this approach generally boils down to verbosity, but I'd argue that it's verbose for all the right reasons. It clarifies all the possible results, and makes the intent explicit.

There are a couple of problems with the inheritance-based results approach, which we'll explore later on, but first I'll compare this to other options we have for implementing the result pattern.

### Comparison With Generic Results

Most implementations I've seen and have used in the past make use of generics. Typically they involve a `Result` class with a generic variant `Result<T>` that wraps a value in the case of a success result. Notably the [FluentResults](https://www.nuget.org/packages/FluentResults/) and [Ardalis.Result](https://www.nuget.org/packages/Ardalis.Result) packages implement this design.

Most people when referring to the _result pattern_ are referring to this approach. To keep things simple we'll look at a basic implementation.

```csharp
sealed class Result<T> where T : notnull
{
    private Result(T? value, Error? error)
    {
        Value = value;
        Error = error;
    }

    public T? Value { get; }
    public Error? Error { get; }

    [MemberNotNullWhen(false, nameof(Error))]
    [MemberNotNullWhen(true, nameof(Value))]
    public bool IsSuccess => Error is null;

    public static Result<T> Success(T value) => new(value, null);
    public static Result<T> Failure(Error error) => new(default, error);
}

record Error(int ErrorCode);
```

Here the `Error` type implements an _error code_ as a discriminator, which is a common way this is handled. Often it'll be combined with a message and possibly more, but in this example we'll stick with the bare minimum. Error codes are typically centralised into their own file, making them easier to maintain.

```csharp
static class ErrorCodes
{
    // ...
    public const int DiscountCodeNotRecognised = 1001;
    public const int DiscountCodeExpired = 1002;
}
```

We can rewrite our `ApplyDiscount` method to return a generic `Result<T>`.

```csharp
readonly record struct Discount(double DiscountPercentage, decimal DiscountedPrice);

internal Result<Discount> ApplyDiscount(string code, decimal originalPrice)
{
    if (!discountCodes.TryGetValue(code.ToUpperInvariant(), out var discount))
        return Result<Discount>.Failure(new Error(ErrorCodes.DiscountCodeNotRecognised));
    if (discount.ExpiresAtUtc < DateTime.UtcNow)
        return Result<Discount>.Failure(new Error(ErrorCodes.DiscountCodeExpired));

    var discountedPrice = Math.Round(originalPrice * (1 - (decimal)discount.Percentage / 100), 2);
    return Result<Discount>.Success(new Discount(discount.Percentage, discountedPrice));
}
```

Unwrapping the result involves accessing properties on the object.

```csharp
var result = ApplyDiscount("SUMMER10", 100.00m);
if (!result.IsSuccess)
{
    return result.Error.ErrorCode switch
    {
        ErrorCodes.DiscountCodeNotRecognised => MapNotFoundResult(),
        ErrorCodes.DiscountCodeExpired => MapExpiredResult(),
        _ => throw new UnreachableException()
    };
}

return MapSuccessResult(result.Value.DiscountPercentage, result.Value.DiscountedPrice);
```

The first thing to note here is while you get warnings from the compiler if the properties are misused, it doesn't guarantee runtime safety. You're also relying on error codes to unwrap each non-successful result and simply put, error codes suck. I could write a whole post on this; to summarise, they are a maintenance nightmare.

Aside from not being well encapsulated, the downside of this implementation is that it is opinionated. As is evident from dropping the `ExpiredAtUtc` property on the result for an expired discount code, we've lost the rich structure of the error results. In most cases, non-successful results come in various shapes. In some cases, a success can be a success to varying degrees. You could model `ExpiredAtUtc` on the `Result<T>` object, though then the object would be poorly encapsulated and maintenance becomes difficult, as each new property you would need to model would require modification of the generic object.

I've only demonstrated a fairly basic generic implementation here, but it can be expanded on in some interesting ways. Check out [this series by Andrew Lock](https://andrewlock.net/series/working-with-the-result-pattern/) for a more detailed look - it's an interesting read. He demonstrates how issues with encapsulation can be solved, albeit with some limitations.

Following the inheritance-based approach, you are free to shape the results however you wish, using properties on each result type. In a case where you need them, you could implement error messages for failures very easily.

```csharp
abstract record ApplyDiscountCodeResult
{
    private ApplyDiscountCodeResult() {}

    public abstract record Failure : ApplyDiscountCodeResult
    {
        private Failure(string friendlyErrorMessage)
        {
            FriendlyErrorMessage = friendlyErrorMessage;
        }

        public string FriendlyErrorMessage { get; }

        public sealed record CodeNotFound(string Code) : Failure($"Discount code '{Code}' is not recognised.");

        public sealed record CodeExpired(string Code, DateTime ExpiredAtUtc) : Failure($"Discount code '{Code}' expired on {ExpiredAtUtc:yyyy-MM-dd}.");
    }

    public sealed record Success(double DiscountPercentage, decimal DiscountedPrice) : ApplyDiscountCodeResult;
}
```

Giving you the ability to handle failures in a common way, as well as the ability to override how specific failures are handled.

```csharp
ApplyDiscountCodeResult result;
switch (result)
{
    case ApplyDiscountCodeResult.Failure.CodeExpired expired:
        // ...
        return;
    case ApplyDiscountCodeResult.Failure failure:
        Console.Error.WriteLine(failure.FriendlyErrorMessage);
        return;
    case ApplyDiscountCodeResult.Success success:
        // ...
        break;
    default:
        throw new UnreachableException();
}
```

There is even the possibility to combine inheritance with generics to create well-encapsulated, reusable result types. 

```csharp
abstract record UserFacingBinaryResult<TSuccess>
{
    private UserFacingBinaryResult() {}

    public sealed record Error(string FriendlyErrorMessage) : UserFacingBinaryResult<TSuccess>;
    public sealed record Success(TSuccess Value) : UserFacingBinaryResult<TSuccess>;
}
```

Where you could again pattern match to unwrap the result.

```csharp
UserFacingBinaryResult<Discount> result;
if (result is UserFacingBinaryResult<Discount>.Error error)
{
    Console.Error.WriteLine(error.FriendlyErrorMessage);
    return;
}

if (result is UserFacingBinaryResult<Discount>.Success success)
{
    var discount = success.Value;
    // ...
    return;
}

throw new UnreachableException();
```

Ultimately generic results are not a bad idea, though a one-size fits all approach is an over-abstraction. There was an argument to make this trade off prior to C# 9, when immutability in the language was verbose, requiring a lot of boilerplate. But the introduction of `record` types changed this.

### Comparison With Enum-based Results

A simpler approach for implementing the result pattern revolves around the use of enums.

```csharp
enum ApplyDiscountCodeStatus
{
    Success, CodeNotFound, CodeExpired,
};

readonly record struct ApplyDiscountCodeResult(ApplyDiscountCodeStatus Status, Discount? Value);

ApplyDiscountCodeResult ApplyDiscount(string code, decimal originalPrice)
{
    if (!discountCodes.TryGetValue(code.ToUpperInvariant(), out var entry))
        return new(ApplyDiscountCodeStatus.CodeNotFound, null);
    if (entry.ExpiresAtUtc < DateTime.UtcNow)
        return new(ApplyDiscountCodeStatus.CodeExpired, null);

    var discountedPrice = Math.Round(originalPrice * (1 - entry.Percentage / 100), 2);
    return new(ApplyDiscountCodeStatus.Success, new Discount(entry.Percentage, discountedPrice), null);
}
```

Where the result can be unwrapped by matching on the enum value.

```csharp
var result = ApplyDiscount("SUMMER10", 100.00m);
return result.Status switch
{
    ApplyDiscountCodeStatus.CodeNotFound => MapNotFoundResult(),
    ApplyDiscountCodeStatus.CodeExpired => MapExpiredResult(),
    ApplyDiscountCodeStatus.Success => MapSuccessResult(result.Value!.DiscountPercentage, result.Value.DiscountedPrice),
    _ => throw new UnreachableException()
};
```

Much like the basic generic implementation, it suffers from the lack of guarantee for runtime safety that the inheritance-based implementation (mostly) provides.

One improvement over the generic implementation example that I laid out above, is that non-successful result errors are defined per result. This can obviously be solved with some amendments to the generic implementation and likewise you could create a hybrid of the two, where you have a generic type; effectively a type-constrained error.

```csharp
sealed class Result<T, TError>
    where T : notnull
    where TError : struct, Enum
{
    public T? Value { get; }
    public TError? Error { get; }

    private Result(T? value, TError? error)
    {
        Value = value;
        Error = error;
    }

    [MemberNotNullWhen(false, nameof(Error))]
    [MemberNotNullWhen(true, nameof(Value))]
    public bool IsSuccess => Error is null;

    public static Result<T, TError> Success(T value) => new(value, null);
    public static Result<T, TError> Failure(TError error) => new(null, error);
}
```

The disadvantage is that you can no longer shape the common `Error` type by adding additonal properties. It's now simply a flat discriminator.

Whichever way you look at it, the enum approach suffers from a lack of flexibility and expressiveness that is provided by the inheritance-based approach. It's more concise, but that comes at a cost.

## Language Limitations

Focusing on the inheritance-based approach that's been laid out, there's a couple of pain points that should be addressed.

### Compile-time Exhaustiveness

Every code snippet so far that involves pattern matching contains the one noisy `throw new UnreachableException()` statement. The reason for this is that the compiler cannot recognise that all possible patterns have been matched.

Take the earlier example where we have an `abstract` result type.

```csharp
abstract record ApplyDiscountCodeResult
{
    private ApplyDiscountCodeResult() {}

    public sealed record CodeNotFound : ApplyDiscountCodeResult
    {
        public static readonly CodeNotFound Instance = new();
    }

    public sealed record CodeExpired(DateTime ExpiredAtUtc) : ApplyDiscountCodeResult;
    public sealed record Success(double DiscountPercentage, decimal DiscountedPrice) : ApplyDiscountCodeResult;
}
```

What you should notice is that this is a _closed heirarchy_ in that all implementations of `ApplyDiscountCodeResult` are defined with it's body. This is enforced via the `private` constructor. Unfortunately, the compiler is unable to determine all possible subtypes. This realistically is a limitation of the compiler and some would consider it a bug. There have been proposals raised around changing this ([#2228](https://github.com/dotnet/csharplang/issues/2228), [#4032](https://github.com/dotnet/csharplang/issues/4032)) which appear to have been closed due to the focus being on discriminated union design.

Within the discriminated union design umbrella, there is an active language proposal for [closed heirarchies](https://github.com/dotnet/csharplang/blob/main/proposals/closed-hierarchies.md) to address this. The proposal defines the introduction of a `closed` modifier that is implicitly `abstract`. The result type could be redefined.

> [!NOTE]
> Closed heirarchies are now a confirmed feature in C# 15.

```csharp
closed record ApplyDiscountCodeResult;
```

Which would allow the compiler to guarantee pattern matching exhaustiveness, removing the need for the default constraint.

You may be wondering why this feature would be needed when the type can be and is `internal`. The reason it needs to be a new language addition is because `internal` members can be exposed to other assembilies, usually through the use of the `InternalsVisibleTo` attribute, and since it is not a dependant relationship, the compiler is unaware of the types declared in the assembly to which they're exposed.

### Heap Allocation

It's worth a mention, though in practice I'm not sure it's much of a concern. Relying on inheritance means that heap allocation is inevitable. Every result you return requires a new object allocation, even if that result is only wrapping a value type - unless it can be cached as singleton. In almost every case that the result pattern shines, object allocation is not going to be the bottleneck. But for hot paths or ultra-high performance code, it's good to be aware.

If you are concerned about heap allocations, the non-generic enum-based approach shown earlier would be what you want, as it does not allocate at all. The generic approach could also be made allocation-free, by defining the relevant generic types as `readonly struct`. A trade-off with doing this is that it loses the guarantee of correctness that a class gives when it comes to encapsulation of the result properties, as the `default` value would return a copy where both the `Value` and `Error` properties are `null`.

## Introducing Unions

[Union types](https://github.com/dotnet/csharplang/blob/main/proposals/unions.md) are a new C# 15 language feature which represent several _case types_. The most straightforward way to use unions is via the `union` declaration.

```csharp
sealed record GiftCard(string Provider, string Reference, decimal Value);
sealed record VoucherCode(string Code, double DiscountPercentage);

union Discount(GiftCard, VoucherCode)
```

The `union` declaration is equivalent to the following lowered code.

```csharp
[Union]
struct Discount : IUnion
{
    Discount(GiftCard value) => Value = (object) value;
    VoucherCode(VoucherCode value) => Value = (object) value;

    public object? Value { get; }
}
```

In effect, a union type is any type to which the `[Union]` attribute is applied. The `union` declaraction is simply an opinionated `struct` union type that implements the following interface.

```csharp
interface IUnion
{
    object? Value { get; }
}
```

This gives it the default behaviour of boxing the case type that is assigned. However, since the criteria for a union type is simply a type to which the `[Union]` attribute is applied, custom implementations including non-boxing implementations are possible.

## Union Results

### Implementation

Taking the example we've been using thus far, here's how it could be written as a union.

```csharp
union ApplyDiscountCodeResult(
    ApplyDiscountCodeResult.CodeNotFound,
    ApplyDiscountCodeResult.CodeExpired,
    ApplyDiscountCodeResult.Success
)
{
    public sealed record CodeNotFound
    {
        public static readonly CodeNotFound Instance = new();
    }
    public sealed record CodeExpired(DateTime ExpiredAtUtc);
    public sealed record Success(double DiscountPercentage, decimal DiscountedPrice);
}
```

Using the union, an implementation of the `ApplyDiscount` method would not change.

```csharp
ApplyDiscountCodeResult ApplyDiscount(string code, decimal originalPrice)
{
    if (!discountCodes.TryGetValue(code.ToUpperInvariant(), out var discount))
        return ApplyDiscountCodeResult.CodeNotFound.Instance;
    if (discount.ExpiresAtUtc < DateTime.UtcNow)
        return new ApplyDiscountCodeResult.CodeExpired(discount.ExpiresAtUtc);

    var discountedPrice = Math.Round(originalPrice * (1 - (decimal)discount.Percentage / 100), 2);
    return new ApplyDiscountCodeResult.Success(discount.Percentage, discountedPrice);
}
```

Looking at the usage it's pretty much the same story.

```csharp
var result = ApplyDiscount("SUMMER10", 100.00m);
return result switch
{
    ApplyDiscountCodeResult.CodeNotFound => MapNotFoundResult(),
    ApplyDiscountCodeResult.CodeExpired expired => MapExpiredResult(expired.ExpiredAtUtc),
    ApplyDiscountCodeResult.Success success => MapSuccessResult(success.DiscountPercentage, success.DiscountedPrice)
};
```

In fact, it's identical, except this time the default case `_ => throw new UnreachableException()` is not defined. A nice advantage of union types is that they create a closed type hierarchy, which the compiler is able to understand and therefore recognises that pattern matching here is exhaustive.

> [!NOTE]
> As of .NET 11.0.100-preview.5, the compiler still shows `warning CS8655: The switch expression does not handle some null inputs (it is not exhaustive). For example, the pattern 'null' is not covered.` even in a nullable-aware context. This appears to be a bug.

### Comparison to Inheritance-based Results

When viewing the decompiled assembly, we can see a slight difference in the code.

```csharp
// Inheritance-based variant
private ApplyDiscountCodeResult ApplyDiscount(string code, decimal originalPrice)
{
    if (!discountCodes.TryGetValue(code.ToUpperInvariant(), out DiscountCode value))
    {
        return ApplyDiscountCodeResult.CodeNotFound.Instance;
    }
    if (value.ExpiresAtUtc < DateTime.UtcNow)
    {
        return new ApplyDiscountCodeResult.CodeExpired(value.ExpiresAtUtc);
    }
    decimal discountedPrice = Math.Round(originalPrice * (1m - (decimal)value.Percentage / 100m), 2);
    return new ApplyDiscountCodeResult.Success(value.Percentage, discountedPrice);
}

```

```csharp
// Union variant
private ApplyDiscountCodeResult ApplyDiscount(string code, decimal originalPrice)
{
    if (!discountCodes.TryGetValue(code.ToUpperInvariant(), out DiscountCode value))
    {
        return new ApplyDiscountCodeResult(ApplyDiscountCodeResult.CodeNotFound.Instance);
    }
    if (value.ExpiresAtUtc < DateTime.UtcNow)
    {
        return new ApplyDiscountCodeResult(new ApplyDiscountCodeResult.CodeExpired(value.ExpiresAtUtc));
    }
    decimal discountedPrice = Math.Round(originalPrice * (1m - (decimal)value.Percentage / 100m), 2);
    return new ApplyDiscountCodeResult(new ApplyDiscountCodeResult.Success(value.Percentage, discountedPrice));
}
```

All the return values are wrapped by `new ApplyDiscountCodeResult(...)`, rather than implicitly cast. This is a subtle difference. As mentioned earlier, the *union declaration* is implemented as a `struct`, which we can see in the decompiled assembly.

```csharp 
[Union]
internal struct ApplyDiscountCodeResult : IUnion
{
    public sealed record CodeNotFound
    {
        public static readonly CodeNotFound Instance = new CodeNotFound();
    }

    public sealed record CodeExpired(DateTime ExpiredAtUtc);

    public sealed record Success(double DiscountPercentage, decimal DiscountedPrice);

    public object? Value { get; }

    [CompilerGenerated]
    public ApplyDiscountCodeResult(CodeNotFound value) => Value = value;

    [CompilerGenerated]
    public ApplyDiscountCodeResult(CodeExpired value) => Value = value;

    [CompilerGenerated]
    public ApplyDiscountCodeResult(Success value) => Value = value;
}
```

Given it's a `struct`, it does not allocate on the heap - it lives on the stack. To get a full picture of what's happening, we can look at the decompiled code for unwrapping the result.

```csharp
// Inheritance-based variant
ApplyDiscountCodeResult applyDiscountCodeResult = ApplyDiscount("SUMMER10", 100m);
if (!(applyDiscountCodeResult is ApplyDiscountCodeResult.CodeNotFound))
{
    if (!(applyDiscountCodeResult is ApplyDiscountCodeResult.CodeExpired codeExpired))
    {
        if (applyDiscountCodeResult is ApplyDiscountCodeResult.Success success)
        {
            return MapSuccessResult(success.DiscountPercentage, success.DiscountedPrice);
        }
        global::<PrivateImplementationDetails>.ThrowSwitchExpressionException(applyDiscountCodeResult);
        string result = default(string);
        return result;
    }
    return MapExpiredResult(codeExpired.ExpiredAtUtc);
}
return MapNotFoundResult();
```

```csharp
// Union variant
ApplyDiscountCodeResult applyDiscountCodeResult = ApplyDiscount("SUMMER10", 100m);
object value = applyDiscountCodeResult.Value;
if (!(value is ApplyDiscountCodeResult.CodeNotFound))
{
    if (!(value is ApplyDiscountCodeResult.CodeExpired codeExpired))
    {
        if (value is ApplyDiscountCodeResult.Success success)
        {
            return MapSuccessResult(success.DiscountPercentage, success.DiscountedPrice);
        }
        global::<PrivateImplementationDetails>.ThrowSwitchExpressionException(applyDiscountCodeResult);
        string result = default(string);
        return result;
    }
    return MapExpiredResult(codeExpired.ExpiredAtUtc);
}
return MapNotFoundResult();
```

A difference exists in that in the union variant, rather than matching on the type itself it matches on `applyDiscountCodeResult.Value`.

Here I think there's something important to note, in that both cases include the same `ThrowSwitchExpressionException` call. As is the case with any reference type, the union variation does not guarantee to be runtime-safe when dereferenced since it is still technically possible to assign a null result. As the union declaration is a `struct` and the `Value` property is defined as `object?`, the value of `default(ApplyDiscountCodeResult)` will evaluate to `null`. 

### Allocation-Free Union Results

It's unlikely you need this, though it is possible to implement. We can create a zero heap-allocation _union type_ result, though we must avoid using the _union declaration_ and instead apply the `[Union]` attribute to our own implementation.

```csharp
[Union]
readonly record struct ApplyDiscountCodeResult
{
    public readonly record struct CodeNotFound;
    public readonly record struct CodeExpired(DateTime ExpiredAtUtc);
    public readonly record struct Success(double DiscountPercentage, decimal DiscountedPrice);

    private readonly CodeNotFound? _codeNotFound;
    private readonly CodeExpired? _codeExpired;
    private readonly Success? _success;

    public ApplyDiscountCodeResult(CodeNotFound value) => _codeNotFound = value;
    public ApplyDiscountCodeResult(CodeExpired value) => _codeExpired = value;
    public ApplyDiscountCodeResult(Success value) => _success = value;

    public object Value => _codeNotFound.HasValue
                                ? _codeNotFound.Value
                                : _codeExpired.HasValue
                                    ? _codeExpired.Value
                                    : _success!.Value;
    public bool HasValue => true;
    public bool TryGetValue(out CodeNotFound value)
    {
        value = _codeNotFound ?? default;
        return _codeNotFound.HasValue;
    }
    public bool TryGetValue(out CodeExpired value)
    {
        value = _codeExpired ?? default;
        return _codeExpired.HasValue;
    }
    public bool TryGetValue(out Success value)
    {
        value = _success ?? default;
        return _success.HasValue;
    }
}
```

It's a fair amount of boilerplate, though could easily be done with a source generator instead.

## Conclusion

To quote the [Union Types language discussion](https://github.com/dotnet/csharplang/discussions/7010):

> Any C# type hierarchy is similar to a union type, as an abstract base can be considered the union type,
> and the derived types the individual cases.

As demonstrated this is true and there's only slight nuances between the approaches. All things considered, union types are an interresting language feature. However when implementing the result pattern I'd likely favour the inheritance-based approach with the addition of closed heirarchies over using unions types, in the majority of cases.